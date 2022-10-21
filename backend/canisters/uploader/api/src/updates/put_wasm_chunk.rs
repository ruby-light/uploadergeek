use candid::CandidType;
use serde::Deserialize;

pub type Args = PutWasmChunkArgs;
pub type Response = PutWasmChunkResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct PutWasmChunkArgs {
    pub chunk: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PutWasmChunkResponse {
    Ok,
    Err(PutWasmChunkError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PutWasmChunkError {
    WrongState,
}
