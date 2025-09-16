use crate::guards::caller_is_governance_user;
use crate::read_state;
use governance_canister::get_proposals::*;
use ic_cdk_macros::query;

#[query(guard = "caller_is_governance_user")]
fn get_proposals(Args { start, count, ascending }: Args) -> Response {
    read_state(|state| {
        let last_proposal_id = state.model.proposal_storage.get_last_proposal_id();
        let total_count = last_proposal_id as usize;

        let iter = state.model.proposal_storage.get_proposals_iter();
        let iter: Box<dyn Iterator<Item = _>> = if ascending { Box::new(iter) } else { Box::new(iter.rev()) };

        let proposals = iter
            .skip(start)
            .take(count)
            .map(|(proposal_id, proposal)| ProposalInfo {
                proposal_id: *proposal_id,
                proposal: proposal.clone(),
            })
            .collect();

        Response::Ok(GetProposalsResult { proposals, total_count })
    })
}
