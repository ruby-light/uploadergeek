use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = SetControllersArgs;
pub type Response = SetControllersResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetControllersArgs {
    pub canister_id: Principal,
    pub controllers: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetControllersResponse {
    Ok,
    Err(SetControllersError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetControllersError {
    LoseControllerDangerous,
    OperationError { reason: String },
}
