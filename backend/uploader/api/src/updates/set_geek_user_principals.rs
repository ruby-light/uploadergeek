use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = SetGeekUserPrincipalsArgs;
pub type Response = SetGeekUserPrincipalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetGeekUserPrincipalsArgs {
    pub geek_user_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetGeekUserPrincipalResponse {
    Ok,
}
