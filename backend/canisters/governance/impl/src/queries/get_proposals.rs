use crate::guards::caller_is_governance_user;
use crate::read_state;
use governance_canister::get_proposals::*;
use ic_cdk_macros::query;

#[query(guard = "caller_is_governance_user")]
fn get_proposals(_args: Args) -> Response {
    read_state(|state| {
        let proposals = state
            .model
            .proposal_storage
            .get_proposals_iter()
            .map(|(proposal_id, proposal)| ProposalInfo {
                proposal_id: *proposal_id,
                proposal: proposal.clone(),
            })
            .collect::<Vec<ProposalInfo>>();

        Response::Ok(GetProposalsResult { proposals })
    })
}
