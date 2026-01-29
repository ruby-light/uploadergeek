use crate::guards::caller_is_governance_user;
use crate::time::get_unix_epoch_time_millis;
use crate::updates::add_new_proposal::parse_candid;
use crate::{log_error, log_info, mutate_state, read_state};
use candid::{IDLArgs, Principal, TypeEnv};
use candid_parser::{check_prog, IDLProg};
use governance_canister::perform_proposal::*;
use governance_canister::types::{
    CallCanister, PerformResult, ProposalDetail, ProposalPermission, ProposalState, ProposalType, UpgradeCanister,
};
use ic_cdk::api::msg_caller;
use ic_cdk::call::CallResult;
use ic_cdk_macros::update;
use uploader_canister::set_operation_grant::{SetOperationGrantArgs, SetOperationGrantResponse};
use uploader_canister::types::{OperationGrant, OperationType, WasmProperties};

#[update(guard = "caller_is_governance_user")]
async fn perform_proposal(args: Args) -> Response {
    let proposal_id = args.proposal_id;

    match perform_proposal_int(args).await {
        Ok(result) => {
            log_info!("Proposal '{proposal_id}' is performed!");
            Response::Ok(result)
        }
        Err(error) => {
            log_error!("Can not perform proposal '{proposal_id}': {error:?}");
            Response::Err(error)
        }
    }
}

async fn perform_proposal_int(args: PerformProposalArgs) -> Result<PerformProposalResult, PerformProposalError> {
    let caller = msg_caller();
    let proposal_id = args.proposal_id;

    let proposal_detail = read_state(|state| {
        let proposal = state
            .model
            .proposal_storage
            .get_proposal(&proposal_id)
            .ok_or(PerformProposalError::ProposalNotFound)?;

        if !matches!(proposal.state, ProposalState::Approved) {
            return Err(PerformProposalError::ProposalIsNotApprovedState);
        }

        let proposal_type = ProposalType::from(&proposal.detail);

        if !state
            .model
            .governance_storage
            .check_is_permission(&caller, &proposal_type, &ProposalPermission::Perform)
        {
            return Err(PerformProposalError::NotPermission);
        }

        Ok(proposal.detail.clone())
    })?;

    let result = perform_proposal_task(&proposal_detail).await;

    let proposal = mutate_state(|state| {
        let proposal = state
            .model
            .proposal_storage
            .get_proposal_mut(&proposal_id)
            .ok_or(PerformProposalError::ProposalNotFound)?;

        if !matches!(proposal.state, ProposalState::Approved) {
            return Err(PerformProposalError::ProposalIsNotApprovedState);
        }

        proposal.state = ProposalState::Performed { result };
        proposal.updated = get_unix_epoch_time_millis();

        Ok(proposal.clone())
    })?;

    Ok(PerformProposalResult { proposal })
}

async fn perform_proposal_task(proposal_detail: &ProposalDetail) -> PerformResult {
    match proposal_detail {
        ProposalDetail::UpdateGovernance { new_governance } => {
            mutate_state(|state| state.model.governance_storage.set_new_governance(new_governance.clone()));
            PerformResult::Done
        }
        ProposalDetail::UpgradeCanister { task } => match perform_upgrade_canister(task).await {
            Ok(_) => PerformResult::Done,
            Err(reason) => PerformResult::Error { reason },
        },
        ProposalDetail::CallCanister { task } => match perform_canister_call(task).await {
            Ok(raw_response) => decode_call_response(&task.canister_did, &task.method, raw_response),
            Err(reason) => PerformResult::Error { reason },
        },
    }
}

async fn perform_upgrade_canister(task: &UpgradeCanister) -> Result<(), String> {
    let args = SetOperationGrantArgs {
        grant: Some(OperationGrant {
            operator: task.operator_id,
            canister_id: task.canister_id,
            operation_type: OperationType::UpgradeCode,
            wasm_properties: WasmProperties {
                wasm_length: None,
                wasm_hash: task.module_hash.clone(),
            },
            arg: parse_candid(task.argument_candid.as_str())?,
        }),
    };

    let result = call_set_operation_grant(task.uploader_id, args)
        .await
        .map_err(|error| format!("error while perform uploader canister call: {error:?}"))?;

    match result {
        SetOperationGrantResponse::Ok => Ok(()),
        SetOperationGrantResponse::Err(error) => Err(format!(
            "error while perform uploader canister set_operation_grant call: {error:?}"
        )),
    }
}

async fn call_set_operation_grant(
    uploader_canister: Principal,
    args: SetOperationGrantArgs,
) -> CallResult<SetOperationGrantResponse> {
    Ok(ic_cdk::call::Call::bounded_wait(uploader_canister, "set_operation_grant")
        .with_arg(args)
        .await?
        .candid()?)
}

async fn perform_canister_call(task: &CallCanister) -> Result<Vec<u8>, String> {
    let canister_id = task.canister_id;
    let method = task.method.as_str();
    let payment = task.payment.unwrap_or(0) as u128;
    let method_args = parse_candid(task.argument_candid.as_str())?;

    ic_cdk::call::Call::bounded_wait(canister_id, method)
        .with_raw_args(method_args.as_slice())
        .with_cycles(payment)
        .await
        .map(|result| result.into_bytes())
        .map_err(|error| format!("error while perform canister call: {error:?}"))

    // ic_cdk::api::call::call_raw(canister_id, method, method_args, payment)
    // .await
    // .map_err(|error| format!("error while perform canister call: {error:?}"))
}

fn decode_call_response(canister_did: &Option<String>, method: &str, raw: Vec<u8>) -> PerformResult {
    match canister_did {
        None => match decode_call_response_without_did(raw.as_slice()) {
            Ok(candid) => PerformResult::CallResponse {
                response: raw,
                candid: Some(candid),
                error: None,
            },
            Err(error) => PerformResult::CallResponse {
                response: raw,
                candid: None,
                error: Some(error),
            },
        },
        Some(canister_did) => match decode_call_response_with_did(canister_did, method, raw.as_slice()) {
            Ok(candid) => PerformResult::CallResponse {
                response: raw,
                candid: Some(candid),
                error: None,
            },
            Err(error) => match decode_call_response_without_did(raw.as_slice()) {
                Ok(candid) => PerformResult::CallResponse {
                    response: raw,
                    candid: Some(candid),
                    error: Some(error),
                },
                Err(error2) => PerformResult::CallResponse {
                    response: raw,
                    candid: None,
                    error: Some(error2),
                },
            },
        },
    }
}

fn decode_call_response_with_did(canister_did: &str, method: &str, raw: &[u8]) -> Result<String, String> {
    let ast: IDLProg = canister_did
        .parse()
        .map_err(|error| format!("can not parse canister did {error:?}"))?;

    let mut env = TypeEnv::new();
    let actor = check_prog(&mut env, &ast)
        .map_err(|error| format!("can not parse canister did {error:?}"))?
        .ok_or("can not find actor in canister did")?;

    let method = env
        .get_method(&actor, method)
        .map_err(|error| format!("can not find '{method}' method in actor: {error:?}"))?;

    let return_arg_types = method.rets.as_slice();

    let idl_args = IDLArgs::from_bytes_with_types(raw, &env, return_arg_types)
        .map_err(|error| format!("can not parse raw with types: {error:?}"))?;

    Ok(idl_args.to_string())
}

fn decode_call_response_without_did(raw: &[u8]) -> Result<String, String> {
    IDLArgs::from_bytes(raw)
        .map(|idl_args| idl_args.to_string())
        .map_err(|error| format!("can not parse raw: {error:?}"))
}

// #[cfg(test)]
// mod tests {
//     use crate::updates::{add_new_proposal::parse_candid, perform_proposal::decode_call_response_with_did};

//     #[test]
//     fn test() {
//         let canister_did = r#"
//             type AccessRight = record {
//              "#;

//         let raw = vec![
//             68, 73, 68, 76, 2, 107, 2, 188, 138, 1, 127, 197, 254, 210, 1, 1, 107, 2, 234, 191, 226, 193, 7, 127, 128, 231,
//             129, 229, 12, 127, 1, 0, 0,
//         ];

//         let result = decode_call_response_with_did(canister_did, "set_upload_wasm_grant", raw.as_slice());
//         println!(">>>> result: {result:?}");

//         let candid = r#"
//             (record{grant = opt record {    operator=principal "6cbt4-ztfyf-7ldym-o2owg-geomw-bkgiy-uuzey-dq4ad-hsly3-txpo7-3qe";    wasm_length=7038831:nat;}})
//             "#;
//         let result = parse_candid(candid);
//         println!(">>>> result: {result:?}");
//     }
// }
// #[cfg(test)]
// mod tests {
//     // use candid::Decode;
//     // use uploader_canister::types::WasmProperties;
//
//     use candid::parser::types::{Binding, Dec, IDLType};
//     use candid::parser::typing::check_type;
//     use candid::types::{Type, TypeInner};
//     use candid::{check_prog, IDLProg};
//
//     #[test]
//     fn test() {
//         use candid::{IDLArgs, TypeEnv};
//
//         // Candid values represented in text format
//         let text_value = r#"
//      (record {wasm_length=123 : nat32; wasm_hash="haha"; arg_candid="aaa"})
// "#;
//
//         // Parse text format into IDLArgs for serialization
//         let args: IDLArgs = text_value.parse().expect("");
//         println!(">>>> {:?}", args.get_types());
//
//         let encoded: Vec<u8> = args.to_bytes().expect("");
//         println!(">>>> {:?}", encoded);
//
//         // Deserialize into IDLArgs
//         let decoded: IDLArgs = IDLArgs::from_bytes(&encoded).expect("");
//         assert_eq!(encoded, decoded.to_bytes().expect(""));
//         //
//         // Convert IDLArgs to text format
//         let output: String = decoded.to_string();
//         println!(">>>> {:?}", output);
//         println!(">>>> {:?}", decoded.get_types());
//
//         let parsed_args: IDLArgs = output.parse().expect("");
//         let annotated_args = args
//             .annotate_types(true, &TypeEnv::new(), &parsed_args.get_types())
//             .expect("");
//         assert_eq!(annotated_args, parsed_args);
//
//         // let wp = Decode!(&encoded, WasmProperties).expect("ss");
//         // println!(">>>> {:?}", wp);
//
//         let did_file = r#"
//     type Wasm = record { wasm_length: nat32; wasm_hash: text; arg_candid: text };
//     type byte = nat8;
//     service : {
//        f : (byte, int, nat, int8) -> (Wasm);
//     }
// "#;
//         //         let did_file = r#"
//         //     type Wasm = record { wasm_length: nat32; wasm_hash: text; arg_candid: text };
//         //     type List = opt record { head: int; tail: List };
//         //     type byte = nat8;
//         //     service : {
//         //       f : (byte, int, nat, int8) -> (List);
//         //       g : (List) -> (int) query;
//         //     }
//         // "#;
//
//         // Parse did file into an AST
//         let ast: IDLProg = did_file.parse().expect("");
//
//         let mut env = TypeEnv::new();
//         let actor: Type = check_prog(&mut env, &ast).expect("").unwrap();
//
//         let method = env.get_method(&actor, "f").unwrap();
//         let r_args = &method.rets;
//         println!(">>>m> {:?}", method);
//         let decoded3: IDLArgs = IDLArgs::from_bytes_with_types(&encoded, &env, r_args.as_slice()).expect("");
//         println!(">>>> {:?}", decoded3.to_string());
//
//         let f = match &ast.decs[0] {
//             Dec::TypD(binding) => {
//                 println!(">>>> {:?}", binding.typ);
//                 let mut env = TypeEnv::new();
//                 let r = env.ast_to_type(&binding.typ);
//                 println!("r>>>> {:?}", r);
//
//                 // &binding.typ
//                 r.unwrap()
//             }
//             Dec::ImportD(_) => panic!(),
//         };
//
//         // Type checking a given .did file
//         // let (env, opt_actor) = check_file("a.did")?;
//         // Or alternatively, use check_prog to check in-memory did file
//         // Note that file import is ignored by check_prog.
//         let env = TypeEnv::new();
//         //         let actor: Type = check_prog(&mut env, &ast).expect("").unwrap();
//         //
//         //         let method = env.get_method(&actor, "g").unwrap();
//         //         assert_eq!(method.is_query(), true);
//         //         assert_eq!(method.args, vec![TypeInner::Var("List".to_string()).into()]);
//
//         // Deserialize into IDLArgs
//         let decoded2: IDLArgs = IDLArgs::from_bytes_with_types(&encoded, &env, vec![f].as_slice()).expect("");
//         let output2: String = decoded2.to_string();
//         println!(">>>> {:?}", output2);
//     }
// }
