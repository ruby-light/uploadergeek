use candid::Principal;
use ic_agent::Agent;
use sha2::{Digest, Sha256};
use std::cmp::min;
use uploader_canister::perform_operation::PerformOperationResponse;
use uploader_canister::set_operation_grant::{SetOperationGrantArgs, SetOperationGrantResponse};
use uploader_canister::types::{EmptyArgs, OperationGrant, WasmProperties};
use uploader_canister::upload_wasm_chunk::{UploadWasmChunkArgs, UploadWasmChunkResponse};

pub type OperationType = uploader_canister::types::OperationType;

pub async fn set_operation_grant(
    agent: &Agent,
    uploader_canister_id: &Principal,
    canister_id: Principal,
    operation_type: OperationType,
    wasm_module: &Vec<u8>,
    arg: Vec<u8>,
) -> Result<(), String> {
    let wasm_hash = get_module_hash(wasm_module);

    let grant = Some(OperationGrant {
        operator: agent.get_principal().unwrap(),
        canister_id,
        operation_type,
        wasm_properties: WasmProperties {
            wasm_length: Some(wasm_module.len()),
            wasm_hash,
        },
        arg,
    });

    match crate::set_operation_grant(agent, uploader_canister_id, &SetOperationGrantArgs { grant }).await {
        Ok(SetOperationGrantResponse::Ok) => Ok(()),
        response => Err(format!("Error while set operation grant: {:?}", response)),
    }
}

pub async fn put_wasm_to_uploader(agent: &Agent, uploader_canister_id: &Principal, wasm: Vec<u8>) -> Result<(), String> {
    let mut from: usize = 0;
    let mut first = true;
    while from < wasm.len() {
        let to = min(from + 2_000_000, wasm.len());

        println!("Put wasm chunk [{from}..{to}] ...");

        match crate::upload_wasm_chunk(
            agent,
            uploader_canister_id,
            &UploadWasmChunkArgs {
                first,
                chunk: wasm[from..to].to_owned(),
            },
        )
        .await
        {
            Ok(UploadWasmChunkResponse::Ok(_)) => {}
            response => {
                return Err(format!("Error while put wasm chunk: {:?}", response));
            }
        }

        first = false;
        from = to;
    }

    println!("Wasm uploaded!");
    Ok(())
}

pub async fn perform_operation(agent: &Agent, uploader_canister_id: &Principal) -> Result<(), String> {
    match crate::perform_operation(agent, uploader_canister_id, &EmptyArgs {}).await {
        Ok(PerformOperationResponse::Ok) => Ok(()),
        response => Err(format!("Error while perform operation: {:?}", response)),
    }
}

pub fn get_module_hash(module: &Vec<u8>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(module);
    format!("{:x}", hasher.finalize())
}
