use crate::guards::caller_is_governance_user;
use crate::read_state;
use governance_canister::get_proposal::*;
use ic_cdk_macros::query;

#[query(guard = "caller_is_governance_user")]
fn get_proposal(args: Args) -> Response {
    read_state(|state| match state.model.proposal_storage.get_proposal(&args.proposal_id) {
        None => Response::Err(GetProposalError::ProposalNotFound),
        Some(proposal) => Response::Ok(GetProposalResult {
            proposal: proposal.clone(),
        }),
    })
}
