use crate::types::{EmptyArgs, GovernanceParticipant};
use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = EmptyArgs;
pub type Response = GetMyGovernanceParticipantResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum GetMyGovernanceParticipantResponse {
    Ok(GetMyGovernanceParticipantResult),
    Err(GetMyGovernanceParticipantError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetMyGovernanceParticipantResult {
    pub participant: GovernanceParticipant,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetMyGovernanceParticipantError {
    NotRegistered { your_principal: Principal },
}
