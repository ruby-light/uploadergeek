use crate::guards::caller_is_authorised;
use crate::read_state;
use governance_canister::get_my_governance_participant::*;
use ic_cdk::api::msg_caller;
use ic_cdk_macros::query;

#[query(guard = "caller_is_authorised")]
fn get_my_governance_participant(_args: Args) -> Response {
    let caller = msg_caller();

    read_state(
        |state| match state.model.governance_storage.get_governance_participant(&caller) {
            None => Response::Err(GetMyGovernanceParticipantError::NotRegistered { your_principal: caller }),
            Some(participant) => Response::Ok(GetMyGovernanceParticipantResult {
                participant: participant.clone(),
            }),
        },
    )
}
