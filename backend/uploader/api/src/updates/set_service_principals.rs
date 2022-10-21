use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = SetServicePrincipalsArgs;
pub type Response = SetServicePrincipalResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetServicePrincipalsArgs {
    pub service_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetServicePrincipalResponse {
    Ok,
    Err(SetServicePrincipalError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetServicePrincipalError {
    Inconsistency,
}
