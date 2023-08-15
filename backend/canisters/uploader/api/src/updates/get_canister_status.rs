use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = GetCanisterStatusArgs;
pub type Response = GetCanisterStatusResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetCanisterStatusArgs {
    pub canister_id: Principal,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetCanisterStatusResponse {
    Ok(GetCanisterStatusResult),
    Err(GetCanisterStatusError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetCanisterStatusResult {
    pub status: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetCanisterStatusError {
    CallError { reason: String },
}
