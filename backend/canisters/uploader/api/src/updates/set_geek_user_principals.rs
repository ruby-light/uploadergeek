use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = SetGeekUserPrincipalsArgs;
pub type Response = SetGeekUserPrincipalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetGeekUserPrincipalsArgs {
    pub geek_user_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetGeekUserPrincipalsResponse {
    Ok,
    Err(SetGeekUserPrincipalsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetGeekUserPrincipalsError {
    LoseControlDangerous,
}
