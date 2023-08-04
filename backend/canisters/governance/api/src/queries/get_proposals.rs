use crate::types::{Proposal, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = GetProposalsArgs;
pub type Response = GetProposalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalsArgs {}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum GetProposalsResponse {
    Ok(GetProposalsResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetProposalsResult {
    pub proposals: Vec<ProposalInfo>,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ProposalInfo {
    pub proposal_id: ProposalId,
    pub proposal: Proposal,
}
