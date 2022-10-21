use candid::CandidType;
use serde::Deserialize;

pub type Args = GetUploadedWasmArgs;
pub type Response = GetUploadedWasmResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetUploadedWasmArgs {}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetUploadedWasmResponse {
    Ok(GetUploadedWasmResult),
    Err(GetUploadedWasmError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetUploadedWasmResult {
    pub len: usize,
    pub wasm_hash: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetUploadedWasmError {
    WrongState,
}
