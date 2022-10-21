use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = InstallWasmArgs;
pub type Response = InstallWasmResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct InstallWasmArgs {
    pub wasm_hash: String,
    pub canister_id: Principal,
    pub arg: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum InstallWasmResponse {
    Ok,
    Err(InstallWasmError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum InstallWasmError {
    WrongState,
    WrongHash,
    InstallError { reason: String },
}
