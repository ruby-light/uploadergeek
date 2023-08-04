use crate::types::{Proposal, ProposalDetail, ProposalId};
use candid::CandidType;
use serde::Deserialize;

pub type Args = AddNewProposalArgs;
pub type Response = AddNewProposalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct AddNewProposalArgs {
    pub proposal_detail: ProposalDetail,
    pub description: Option<String>,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum AddNewProposalResponse {
    Ok(AddNewProposalResult),
    Err(AddNewProposalError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct AddNewProposalResult {
    pub proposal_id: ProposalId,
    pub proposal: Proposal,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum AddNewProposalError {
    NotPermission,
    Validation { reason: String },
}
