use crate::types::{Proposal, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = GetProposalArgs;
pub type Response = GetProposalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalArgs {
    pub proposal_id: ProposalId,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum GetProposalResponse {
    Ok(GetProposalResult),
    Err(GetProposalError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalResult {
    pub proposal: Proposal,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetProposalError {
    ProposalNotFound,
}
