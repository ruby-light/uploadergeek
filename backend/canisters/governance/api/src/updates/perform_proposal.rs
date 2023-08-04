use crate::types::{Proposal, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = PerformProposalArgs;
pub type Response = PerformProposalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct PerformProposalArgs {
    pub proposal_id: ProposalId,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum PerformProposalResponse {
    Ok(PerformProposalResult),
    Err(PerformProposalError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PerformProposalResult {
    pub proposal: Proposal,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PerformProposalError {
    ProposalNotFound,
    ProposalIsNotApprovedState,
    NotPermission,
}
