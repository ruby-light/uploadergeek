use crate::types::Governance;
use candid::{CandidType, Principal};
use serde::Deserialize;

#[derive(CandidType, Deserialize, Debug)]
pub struct Args {
    pub governance: Governance,
    pub geek_user_principals: Vec<Principal>,
}
