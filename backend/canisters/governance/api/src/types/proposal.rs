use crate::types::{Governance, ProposalType};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type ProposalId = u64;
pub type TimestampMillis = u64;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Proposal {
    pub proposal_id: ProposalId,
    pub created: TimestampMillis,
    pub initiator: Principal,
    pub description: Option<String>,
    pub detail: ProposalDetail,
    pub updated: TimestampMillis,
    pub state: ProposalState,
    pub voting: Voting,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProposalState {
    Voting,
    Declined,
    Approved,
    Performed { result: PerformResult },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum PerformResult {
    Done,
    CallResponse {
        response: Vec<u8>,
        candid: Result<String, String>,
    },
    Error {
        reason: String,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct Voting {
    pub votes: Vec<Vote>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Vote {
    pub participant: Principal,
    pub vote_time: TimestampMillis,
    pub vote: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ProposalDetail {
    UpdateGovernance { new_governance: Governance },
    UpgradeCanister { task: UpgradeCanister },
    CallCanister { task: CallCanister },
}

impl From<&ProposalDetail> for ProposalType {
    fn from(detail: &ProposalDetail) -> Self {
        match detail {
            ProposalDetail::UpdateGovernance { .. } => ProposalType::UpdateGovernance,
            ProposalDetail::UpgradeCanister { .. } => ProposalType::UpgradeCanister,
            ProposalDetail::CallCanister { .. } => ProposalType::CallCanister,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpgradeCanister {
    pub uploader_id: Principal,
    pub canister_id: Principal,
    pub operator_id: Principal,
    pub module_hash: String,
    pub argument_candid: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CallCanister {
    pub canister_id: Principal,
    pub method: String,
    pub argument_candid: String,
    pub payment: Option<u64>,
    pub response_candid: String,
}
