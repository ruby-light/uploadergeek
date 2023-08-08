use crate::guards::caller_is_governance_user;
use crate::read_state;
use governance_canister::get_governance::*;
use ic_cdk_macros::query;

#[query(guard = "caller_is_governance_user")]
fn get_governance(_args: Args) -> Response {
    read_state(|state| {
        Response::Ok(GetGovernanceResult {
            governance: state.model.governance_storage.get_governance().clone(),
        })
    })
}
