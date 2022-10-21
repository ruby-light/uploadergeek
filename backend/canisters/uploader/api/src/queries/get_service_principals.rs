use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = GetServicePrincipalsArgs;
pub type Response = GetServicePrincipalsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetServicePrincipalsArgs {}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetServicePrincipalsResponse {
    Ok(GetServicePrincipalsResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetServicePrincipalsResult {
    pub service_principals: Vec<Principal>,
}
