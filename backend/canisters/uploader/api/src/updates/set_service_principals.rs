use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = SetServicePrincipalsArgs;
pub type Response = SetServicePrincipalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetServicePrincipalsArgs {
    pub service_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetServicePrincipalsResponse {
    Ok,
    Err(SetServicePrincipalsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetServicePrincipalsError {
    LoseControlDangerous,
}
