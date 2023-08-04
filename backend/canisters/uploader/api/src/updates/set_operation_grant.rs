use crate::types::OperationGrant;
use candid::CandidType;
use serde::{Deserialize, Serialize};

pub type Args = SetOperationGrantArgs;
pub type Response = SetOperationGrantResponse;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SetOperationGrantArgs {
    pub grant: Option<OperationGrant>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum SetOperationGrantResponse {
    Ok,
    Err(SetOperationGrantError),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum SetOperationGrantError {
    WrongWasmLength,
}
