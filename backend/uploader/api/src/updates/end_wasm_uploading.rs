use candid::CandidType;
use serde::Deserialize;

pub type Args = EndWasmUploadArgs;
pub type Response = EndWasmUploadResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct EndWasmUploadArgs {
    pub wasm_hash: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum EndWasmUploadResponse {
    Ok,
    Err(EndWasmUploadError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum EndWasmUploadError {
    WrongState,
    WrongHash,
}
