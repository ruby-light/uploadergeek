use crate::guards::caller_is_governance_user;
use crate::time::get_unix_epoch_time_millis;
use crate::{log_error, log_info, mutate_state};
use governance_canister::types::{Proposal, ProposalPermission, ProposalState, ProposalType, Vote, VotingConfig};
use governance_canister::vote_for_proposal::*;
use ic_cdk_macros::update;

#[update(guard = "caller_is_governance_user")]
fn vote_for_proposal(args: Args) -> Response {
    let proposal_id = args.proposal_id;

    match vote_for_proposal_int(args) {
        Ok(result) => {
            log_info!("Voted for proposal '{proposal_id}': {:?}", result.proposal.voting);
            Response::Ok(result)
        }
        Err(error) => {
            log_error!("Can not vote for proposal '{proposal_id}': {error:?}");
            Response::Err(error)
        }
    }
}

fn vote_for_proposal_int(args: VoteForProposalArgs) -> Result<VoteForProposalResult, VoteForProposalError> {
    let caller = ic_cdk::caller();
    let proposal_id = args.proposal_id;
    let vote = args.vote;

    mutate_state(|state| {
        let proposal = state
            .model
            .proposal_storage
            .get_proposal_mut(&proposal_id)
            .ok_or(VoteForProposalError::ProposalNotFound)?;

        if !matches!(proposal.state, ProposalState::Voting) {
            return Err(VoteForProposalError::ProposalIsNotVotingState);
        }

        if proposal.voting.votes.iter().any(|vote| vote.participant == caller) {
            return Err(VoteForProposalError::AlreadyVoted);
        }

        let proposal_type = ProposalType::from(&proposal.detail);
        let voting_config = state
            .model
            .governance_storage
            .get_voting_configuration(&proposal_type)
            .ok_or(VoteForProposalError::VotingConfigNotFound)?;

        if !state
            .model
            .governance_storage
            .check_is_permission(&caller, &proposal_type, &ProposalPermission::Vote)
        {
            return Err(VoteForProposalError::NotPermission);
        }

        let time = get_unix_epoch_time_millis();

        proposal.voting.votes.push(Vote {
            participant: caller,
            vote_time: time,
            vote,
        });

        proposal.updated = time;

        check_voting_finish(proposal, voting_config);

        Ok(VoteForProposalResult {
            proposal: proposal.clone(),
        })
    })
}

fn check_voting_finish(proposal: &mut Proposal, voting_config: &VotingConfig) {
    if (proposal.voting.votes.len() as u32) < voting_config.stop_vote_count {
        return;
    }

    let mut positive = 0;

    for vote in proposal.voting.votes.iter() {
        if vote.vote {
            positive += 1;
        }
    }

    proposal.state = if positive >= voting_config.positive_vote_count {
        ProposalState::Approved
    } else {
        ProposalState::Declined
    };
}
