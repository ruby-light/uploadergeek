use crate::types::{Proposal, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = VoteForProposalArgs;
pub type Response = VoteForProposalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct VoteForProposalArgs {
    pub proposal_id: ProposalId,
    pub vote: bool,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum VoteForProposalResponse {
    Ok(VoteForProposalResult),
    Err(VoteForProposalError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct VoteForProposalResult {
    pub proposal: Proposal,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum VoteForProposalError {
    ProposalNotFound,
    ProposalIsNotVotingState,
    VotingConfigNotFound,
    AlreadyVoted,
    NotPermission,
}
