use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type WasmLength = usize;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OperationGrant {
    pub operator: Principal,
    pub canister_id: Principal,
    pub operation_type: OperationType,
    pub wasm_properties: WasmProperties,
    pub arg: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum OperationType {
    InstallCode,
    UpgradeCode,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct WasmProperties {
    pub wasm_length: Option<WasmLength>,
    pub wasm_hash: String,
}
