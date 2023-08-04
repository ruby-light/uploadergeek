use crate::types::WasmLength;
use candid::CandidType;
use serde::Deserialize;

pub type Args = UploadWasmChunkArgs;
pub type Response = UploadWasmChunkResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct UploadWasmChunkArgs {
    pub first: bool,
    pub chunk: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UploadWasmChunkResponse {
    Ok(UploadWasmChunkResult),
    Err(UploadWasmChunkError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct UploadWasmChunkResult {
    pub length: WasmLength,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UploadWasmChunkError {
    WasmLengthOverflow,
}
