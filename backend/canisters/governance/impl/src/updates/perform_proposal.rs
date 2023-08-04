use crate::guards::caller_is_governance_user;
use crate::time::get_unix_epoch_time_millis;
use crate::updates::add_new_proposal::parse_candid;
use crate::{log_error, log_info, mutate_state, read_state};
use governance_canister::perform_proposal::*;
use governance_canister::types::{
    CallCanister, PerformResult, ProposalDetail, ProposalPermission, ProposalState, ProposalType, UpgradeCanister,
};
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
    let caller = ic_cdk::caller();
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
            Ok(raw_response) => decode_call_response(&task.response_candid, raw_response),
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

    let result: (SetOperationGrantResponse,) = ic_cdk::api::call::call(task.uploader_id, "set_operation_grant", (args,))
        .await
        .map_err(|error| format!("error while perform uploader canister call: {error:?}"))?;

    match result.0 {
        SetOperationGrantResponse::Ok => Ok(()),
        SetOperationGrantResponse::Err(error) => Err(format!(
            "error while perform uploader canister set_operation_grant call: {error:?}"
        )),
    }
}

async fn perform_canister_call(task: &CallCanister) -> Result<Vec<u8>, String> {
    let canister_id = task.canister_id;
    let method = task.method.as_str();
    let payment = task.payment.unwrap_or(0);
    let method_args = parse_candid(task.argument_candid.as_str())?;

    ic_cdk::api::call::call_raw(canister_id, method, method_args, payment)
        .await
        .map_err(|error| format!("error while perform canister call: {error:?}"))
}

fn decode_call_response(candid: &String, raw: Vec<u8>) -> PerformResult {
    // todo
    PerformResult::CallResponse {
        response: raw,
        candid: Ok(candid.to_string()),
    }
}
