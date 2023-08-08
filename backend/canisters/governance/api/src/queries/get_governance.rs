use crate::types::{EmptyArgs, Governance};
use candid::CandidType;
use serde::Deserialize;

pub type Args = EmptyArgs;
pub type Response = GetGovernanceResponse;

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum GetGovernanceResponse {
    Ok(GetGovernanceResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetGovernanceResult {
    pub governance: Governance,
}
