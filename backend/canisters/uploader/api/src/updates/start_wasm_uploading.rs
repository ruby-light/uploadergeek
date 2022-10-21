use candid::CandidType;
use serde::Deserialize;

pub type Args = StartWasmUploadArgs;
pub type Response = StartWasmUploadResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct StartWasmUploadArgs {}

#[derive(CandidType, Deserialize, Debug)]
pub enum StartWasmUploadResponse {
    Ok,
}
