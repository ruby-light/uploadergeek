use crate::model::geek_users::GeekUserStorage;
use crate::model::governance::GovernanceStorage;
use crate::model::proposal::ProposalStorage;
use serde::{Deserialize, Serialize};

pub mod geek_users;
pub mod governance;
pub mod proposal;

#[derive(Serialize, Deserialize, Default)]
pub struct DataModel {
    pub geek_user_storage: GeekUserStorage,
    pub proposal_storage: ProposalStorage,
    pub governance_storage: GovernanceStorage,
}
