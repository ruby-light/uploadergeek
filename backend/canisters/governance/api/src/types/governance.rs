use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct Governance {
    pub participants: Vec<(Principal, GovernanceParticipant)>,
    pub voting_configuration: Vec<(ProposalType, VotingConfig)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VotingConfig {
    pub stop_vote_count: u32,
    pub positive_vote_count: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GovernanceParticipant {
    pub name: String,
    pub proposal_permissions: Vec<(ProposalType, Vec<ProposalPermission>)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Eq, Ord, PartialOrd, PartialEq)]
pub enum ProposalPermission {
    Add,
    Vote,
    Perform,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Eq, Ord, PartialOrd, PartialEq)]
pub enum ProposalType {
    UpdateGovernance,
    UpgradeCanister,
    CallCanister,
}
