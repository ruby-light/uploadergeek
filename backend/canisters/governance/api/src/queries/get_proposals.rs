use crate::types::{Proposal, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = GetProposalsArgs;
pub type Response = GetProposalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalsArgs {
    pub start: usize,
    pub count: usize,
    pub ascending: bool,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum GetProposalsResponse {
    Ok(GetProposalsResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalsResult {
    pub proposals: Vec<ProposalInfo>,
    pub total_count: usize,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ProposalInfo {
    pub proposal_id: ProposalId,
    pub proposal: Proposal,
}
