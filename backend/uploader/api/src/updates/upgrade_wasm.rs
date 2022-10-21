use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = UpgradeWasmArgs;
pub type Response = UpgradeWasmResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct UpgradeWasmArgs {
    pub wasm_hash: String,
    pub canister_id: Principal,
    pub arg: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UpgradeWasmResponse {
    Ok,
    Err(UpgradeWasmError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UpgradeWasmError {
    WrongState,
    WrongHash,
    UpgradeError { reason: String },
}
