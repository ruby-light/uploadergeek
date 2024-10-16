use crate::guards::caller_is_governance_user;
use crate::read_state;
use governance_canister::get_proposals::*;
use ic_cdk_macros::query;

#[query(guard = "caller_is_governance_user")]
fn get_proposals(_args: Args) -> Response {
    read_state(|state| {
        let last_proposal_id = state.model.proposal_storage.get_last_proposal_id();
        let start_from_id = 1 + last_proposal_id.saturating_sub(100);

        let mut proposals = Vec::new();
        for (proposal_id, proposal) in state.model.proposal_storage.get_proposals_iter() {
            if proposal_id >= &start_from_id {
                proposals.push(ProposalInfo {
                    proposal_id: *proposal_id,
                    proposal: proposal.clone(),
                });
            }
        }

        Response::Ok(GetProposalsResult { proposals })
    })
}
