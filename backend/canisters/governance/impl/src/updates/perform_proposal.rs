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
            Ok(raw_response) => decode_call_response(task, raw_response),
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
}

fn decode_call_response(task: &CallCanister, raw: Vec<u8>) -> PerformResult {
    if task.canister_did.is_some() {
        match decode_call_response_with_did(task, raw.as_slice()) {
            Ok(idl_args) => PerformResult::CallResponse {
                response: raw,
                candid: Some(idl_args.to_string()),
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
                    error: Some(error + " / " + error2.as_str()),
                },
            },
        }
    } else {
        match decode_call_response_without_did(raw.as_slice()) {
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
        }
    }
}

fn decode_call_response_without_did(raw: &[u8]) -> Result<String, String> {
    IDLArgs::from_bytes(raw)
        .map(|idl_args| idl_args.to_string())
        .map_err(|error| format!("can not parse raw: {error:?}"))
}

fn decode_call_response_with_did(task: &CallCanister, raw: &[u8]) -> Result<IDLArgs, String> {
    decode_method_response(task.canister_did.as_ref().unwrap().as_str(), task.method.as_str(), raw)

    // let transit_canister_did = r#"
    //         type CallResponse = variant {
    //           Ok : CallResult;
    //           Err : CallError;
    //         };
    //         type CallError = variant { CallError : record { reason : text } };
    //         type CallResult = record { result : blob };
    //         service : {
    //           perform_call : () -> (CallResponse);
    //         }
    //         "#;

    // let args = decode_method_response(transit_canister_did, "perform_call", raw)?;
    // if args.args.len() == 1 {
    //     if let candid::IDLValue::Variant(variant_value) = args.args.first().unwrap() {
    //         let enum_value = &variant_value.0;
    //         if enum_value.id.get_id() == 17724 {
    //             // Ok
    //             if let candid::IDLValue::Record(idlfields) = &enum_value.val {
    //                 if idlfields.len() == 1 {
    //                     let field = &idlfields.get(0).unwrap();
    //                     if field.id.get_id() == 142895325 {
    //                         // result
    //                         if let candid::IDLValue::Blob(raw) = &field.val {
    //                             return decode_method_response(
    //                                 task.canister_did.as_ref().unwrap().as_str(),
    //                                 "get_geek_user_principals",
    //                                 raw,
    //                             );
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    // decode_method_response(task.canister_did.as_ref().unwrap().as_str(), task.method.as_str(), raw)
}

pub(crate) fn decode_method_response(canister_did: &str, method: &str, raw: &[u8]) -> Result<IDLArgs, String> {
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

    IDLArgs::from_bytes_with_types(raw, &env, return_arg_types)
        .map_err(|error| format!("can not parse raw with types: {error:?}"))
}

// #[cfg(test)]
// mod tests {
//     use candid::{Decode, Encode, IDLValue, Principal};
//     use candid_parser::parse_idl_args;
//     use governance_canister::types::CallCanister;
//     use ic_cdk::management_canister::{CanisterSettings, UpdateSettingsArgs};

//     use crate::updates::perform_proposal::decode_call_response_with_did;

//     #[test]
//     fn test_decode_simple_call_response() {
//         let hex = "4449444c056b02bc8a0101c5fed201036c01ddd19144026d7b6b01aa8cf0890a046c01c49ff4e40f71010000384449444c036b01bc8a01016c01bec6aed90f026d6801000001011d65c17eb1e18ed3ac6311ccb054646294c9303870033c978dceef77f702";
//         let raw = hex::decode(hex).unwrap();

//         let canister_did = r#"
//             type PerformCallResponse = variant {
//               Ok : PerformCallResult;
//               Err : PerformCallError;
//             };
//             type PerformCallError = variant { CallError : record { reason : text } };
//             type PerformCallResult = record { result : blob };
//             service : {
//               simple_call : () -> (PerformCallResponse);
//             }
//             "#;

//         let result = decode_call_response_with_did(
//             &CallCanister {
//                 canister_id: Principal::anonymous(),
//                 method: "simple_call".to_owned(),
//                 argument_candid: "(record{})".to_owned(),
//                 payment: None,
//                 canister_did: Some(canister_did.to_owned()),
//             },
//             raw.as_slice(),
//         )
//         .unwrap();
//         println!(">>>>> {:?}", result.to_string());
//         assert_eq!(result.args.len(), 1);
//     }

//     #[test]
//     fn test_parse_type2() {
//         let text = r#"(
//             blob "\44\49\44\4c\03\6b\01\bc\8a\01\01\6c\01\be\c6\ae\d9\0f\02\6d\68\01\00\00\01\01\1d\65\c1\7e\b1\e1\8e\d3\ac\63\11\cc\b0\54\64\62\94\c9\30\38\70\03\3c\97\8d\ce\ef\77\f7\02"
//             )"#;
//         let r = parse_idl_args(text).unwrap();
//         println!("Parsed IDLArgs: {:?}", r);

//         let blob = IDLValue::Blob(r.to_bytes().unwrap());
//         println!(">>>>>>> {}", blob.to_string());
//     }

//     #[test]
//     fn test_decode_perform_call_response() {
//         let hex = "4449444c056b02bc8a0101c5fed201036c01ddd19144026d7b6b01aa8cf0890a046c01c49ff4e40f71010000384449444c036b01bc8a01016c01bec6aed90f026d6801000001011d65c17eb1e18ed3ac6311ccb054646294c9303870033c978dceef77f702";
//         let raw = hex::decode(hex).unwrap();

//         let canister_did = r#"
//             type AddNewProposalArgs = record {
//               proposal_detail : ProposalDetail;
//               description : opt text;
//             };
//             type AddNewProposalError = variant {
//               NotPermission;
//               Validation : record { reason : text };
//             };
//             type AddNewProposalResponse = variant {
//               Ok : AddNewProposalResult;
//               Err : AddNewProposalError;
//             };
//             type AddNewProposalResult = record { proposal_id : nat64; proposal : Proposal };
//             type Args = record {
//               governance : Governance;
//               geek_user_principals : vec principal;
//             };
//             type CallCanister = record {
//               method : text;
//               canister_did : opt text;
//               canister_id : principal;
//               argument_candid : text;
//               payment : opt nat64;
//             };
//             type CanisterLogFeature = variant {
//               filterMessageByContains;
//               filterMessageByRegex;
//             };
//             type CanisterLogMessages = record {
//               data : vec LogMessageData;
//               lastAnalyzedMessageTimeNanos : opt nat64;
//             };
//             type CanisterLogMessagesInfo = record {
//               features : vec opt CanisterLogFeature;
//               lastTimeNanos : opt nat64;
//               count : nat32;
//               firstTimeNanos : opt nat64;
//             };
//             type CanisterLogRequest = variant {
//               getMessagesInfo;
//               getMessages : GetLogMessagesParameters;
//               getLatestMessages : GetLatestLogMessagesParameters;
//             };
//             type CanisterLogResponse = variant {
//               messagesInfo : CanisterLogMessagesInfo;
//               messages : CanisterLogMessages;
//             };
//             type CanisterMetrics = record { data : CanisterMetricsData };
//             type CanisterMetricsData = variant {
//               hourly : vec HourlyMetricsData;
//               daily : vec DailyMetricsData;
//             };
//             type CollectMetricsRequestType = variant { force; normal };
//             type DailyMetricsData = record {
//               updateCalls : nat64;
//               canisterHeapMemorySize : NumericEntity;
//               canisterCycles : NumericEntity;
//               canisterMemorySize : NumericEntity;
//               timeMillis : int;
//             };
//             type GetGeekUserPrincipalsResponse = variant {
//               Ok : GetGeekUserPrincipalsResult;
//             };
//             type GetGeekUserPrincipalsResult = record {
//               geek_user_principals : vec principal;
//             };
//             type GetGovernanceResponse = variant { Ok : GetGovernanceResult };
//             type GetGovernanceResult = record { governance : Governance };
//             type GetInformationRequest = record {
//               status : opt StatusRequest;
//               metrics : opt MetricsRequest;
//               logs : opt CanisterLogRequest;
//               version : bool;
//             };
//             type GetInformationResponse = record {
//               status : opt StatusResponse;
//               metrics : opt MetricsResponse;
//               logs : opt CanisterLogResponse;
//               version : opt nat;
//             };
//             type GetLatestLogMessagesParameters = record {
//               upToTimeNanos : opt nat64;
//               count : nat32;
//               filter : opt GetLogMessagesFilter;
//             };
//             type GetLogMessagesFilter = record {
//               analyzeCount : nat32;
//               messageRegex : opt text;
//               messageContains : opt text;
//             };
//             type GetLogMessagesParameters = record {
//               count : nat32;
//               filter : opt GetLogMessagesFilter;
//               fromTimeNanos : opt nat64;
//             };
//             type GetMetricsParameters = record {
//               dateToMillis : nat;
//               granularity : MetricsGranularity;
//               dateFromMillis : nat;
//             };
//             type GetMyGovernanceParticipantError = variant {
//               NotRegistered : record { your_principal : principal };
//             };
//             type GetMyGovernanceParticipantResponse = variant {
//               Ok : GetMyGovernanceParticipantResult;
//               Err : GetMyGovernanceParticipantError;
//             };
//             type GetMyGovernanceParticipantResult = record {
//               participant : GovernanceParticipant;
//             };
//             type GetProposalArgs = record { proposal_id : nat64 };
//             type GetProposalError = variant { ProposalNotFound };
//             type GetProposalResponse = variant {
//               Ok : GetProposalResult;
//               Err : GetProposalError;
//             };
//             type GetProposalResult = record { proposal : Proposal };
//             type GetProposalsArgs = record {
//               count : nat64;
//               start : nat64;
//               ascending : bool;
//             };
//             type GetProposalsResponse = variant { Ok : GetProposalsResult };
//             type GetProposalsResult = record {
//               proposals : vec ProposalInfo;
//               total_count : nat64;
//             };
//             type Governance = record {
//               participants : vec record { principal; GovernanceParticipant };
//               voting_configuration : vec record { ProposalType; VotingConfig };
//             };
//             type GovernanceParticipant = record {
//               proposal_permissions : vec record { ProposalType; vec ProposalPermission };
//               name : text;
//             };
//             type HourlyMetricsData = record {
//               updateCalls : vec nat64;
//               canisterHeapMemorySize : vec nat64;
//               canisterCycles : vec nat64;
//               canisterMemorySize : vec nat64;
//               timeMillis : int;
//             };
//             type LogMessageData = record { timeNanos : nat64; message : text };
//             type MetricsGranularity = variant { hourly; daily };
//             type MetricsRequest = record { parameters : GetMetricsParameters };
//             type MetricsResponse = record { metrics : opt CanisterMetrics };
//             type NumericEntity = record {
//               avg : nat64;
//               max : nat64;
//               min : nat64;
//               first : nat64;
//               last : nat64;
//             };
//             type PerformProposalError = variant {
//               NotPermission;
//               ProposalIsNotApprovedState;
//               ProposalNotFound;
//             };
//             type PerformProposalResponse = variant {
//               Ok : GetProposalResult;
//               Err : PerformProposalError;
//             };
//             type PerformResult = variant {
//               Error : record { reason : text };
//               Done;
//               CallResponse : record {
//                 error : opt text;
//                 response : blob;
//                 candid : opt text;
//               };
//             };
//             type Proposal = record {
//               created : nat64;
//               initiator : principal;
//               description : opt text;
//               voting : Voting;
//               detail : ProposalDetail;
//               state : ProposalState;
//               updated : nat64;
//               proposal_id : nat64;
//             };
//             type ProposalDetail = variant {
//               UpdateGovernance : record { new_governance : Governance };
//               UpgradeCanister : record { task : UpgradeCanister };
//               CallCanister : record { task : CallCanister };
//             };
//             type ProposalInfo = record { proposal_id : nat64; proposal : Proposal };
//             type ProposalPermission = variant { Add; Vote; Perform };
//             type ProposalState = variant {
//               Approved;
//               Voting;
//               Declined;
//               Performed : record { result : PerformResult };
//             };
//             type ProposalType = variant { UpdateGovernance; UpgradeCanister; CallCanister };
//             type SetGeekUserPrincipalsArgs = record {
//               geek_user_principals : vec principal;
//             };
//             type SetGeekUserPrincipalsError = variant { LoseControlDangerous };
//             type SetGeekUserPrincipalsResponse = variant {
//               Ok;
//               Err : SetGeekUserPrincipalsError;
//             };
//             type StatusRequest = record {
//               memory_size : bool;
//               cycles : bool;
//               heap_memory_size : bool;
//             };
//             type StatusResponse = record {
//               memory_size : opt nat64;
//               cycles : opt nat64;
//               heap_memory_size : opt nat64;
//             };
//             type UpdateInformationRequest = record {
//               metrics : opt CollectMetricsRequestType;
//             };
//             type UpgradeCanister = record {
//               uploader_id : principal;
//               operator_id : principal;
//               canister_id : principal;
//               module_hash : text;
//               argument_candid : text;
//             };
//             type Vote = record { vote_time : nat64; vote : bool; participant : principal };
//             type VoteForProposalArgs = record { vote : bool; proposal_id : nat64 };
//             type VoteForProposalError = variant {
//               AlreadyVoted;
//               ProposalIsNotVotingState;
//               VotingConfigNotFound;
//               NotPermission;
//               ProposalNotFound;
//             };
//             type VoteForProposalResponse = variant {
//               Ok : GetProposalResult;
//               Err : VoteForProposalError;
//             };
//             type Voting = record { votes : vec Vote };
//             type VotingConfig = record {
//               stop_vote_count : nat32;
//               positive_vote_count : nat32;
//             };
//             service : (Args) -> {
//               add_new_proposal : (AddNewProposalArgs) -> (AddNewProposalResponse);
//               getCanistergeekInformation : (GetInformationRequest) -> (
//                   opt GetInformationResponse,
//                 ) query;
//               get_geek_user_principals : (record {}) -> (
//                   GetGeekUserPrincipalsResponse,
//                 ) query;
//               get_governance : (record {}) -> (GetGovernanceResponse) query;
//               get_my_governance_participant : (record {}) -> (
//                   GetMyGovernanceParticipantResponse,
//                 ) query;
//               get_proposal : (GetProposalArgs) -> (GetProposalResponse) query;
//               get_proposals : (GetProposalsArgs) -> (GetProposalsResponse) query;
//               perform_proposal : (GetProposalArgs) -> (PerformProposalResponse);
//               set_geek_user_principals : (SetGeekUserPrincipalsArgs) -> (
//                   SetGeekUserPrincipalsResponse,
//                 );
//               updateCanistergeekInformation : (UpdateInformationRequest) -> ();
//               vote_for_proposal : (VoteForProposalArgs) -> (VoteForProposalResponse);
//             }           "#;

//         // let raw_int = vec![
//         // 68, 73, 68, 76, 3, 107, 1, 188, 138, 1, 1, 108, 1, 190, 198, 174, 217, 15, 2, 109, 104, 1, 0, 0, 1, 1, 29, 101,
//         // 193, 126, 177, 225, 142, 211, 172, 99, 17, 204, 176, 84, 100, 98, 148, 201, 48, 56, 112, 3, 60, 151, 141, 206, 239,
//         // 119, 247, 2,
//         // ];

//         let result = decode_call_response_with_did(
//             &CallCanister {
//                 canister_id: Principal::anonymous(),
//                 method: "get_geek_user_principals".to_owned(),
//                 argument_candid: "(record{})".to_owned(),
//                 payment: None,
//                 canister_did: Some(canister_did.to_owned()),
//             },
//             raw.as_slice(),
//         );
//         println!(">>>> result: {result:?}");
//     }
// }

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
