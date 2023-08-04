use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = PerformCallArgs;
pub type Response = SetOperationGrantResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct PerformCallArgs {
    pub canister_id: Principal,
    pub method: String,
    pub args: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetOperationGrantResponse {
    Ok(PerformCallResult),
    Err(PerformCallError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PerformCallResult {
    pub result: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PerformCallError {
    CallError { reason: String },
}
