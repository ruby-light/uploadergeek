use crate::types::{EmptyArgs, WasmLength};
use candid::CandidType;
use serde::Deserialize;

pub type Args = EmptyArgs;
pub type Response = PerformOperationResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum PerformOperationResponse {
    Ok,
    Err(PerformOperationError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PerformOperationError {
    WrongWasmLength { length: WasmLength },
    WrongWasmHash { hash: String },
    OperationError { reason: String },
}
