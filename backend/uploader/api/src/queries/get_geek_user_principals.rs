use crate::EmptyArgs;
use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = EmptyArgs;
pub type Response = GetGeekUserPrincipalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum GetGeekUserPrincipalsResponse {
    Ok(GetGeekUserPrincipalsResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetGeekUserPrincipalsResult {
    pub geek_user_principals: Vec<Principal>,
}
