use crate::types::OperationGrant;
use candid::CandidType;
use serde::Deserialize;

pub type Args = SetOperationGrantArgs;
pub type Response = SetOperationGrantResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetOperationGrantArgs {
    pub grant: Option<OperationGrant>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetOperationGrantResponse {
    Ok,
    Err(SetOperationGrantError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetOperationGrantError {
    WrongWasmLength,
}
