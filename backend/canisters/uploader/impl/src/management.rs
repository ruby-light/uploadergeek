use sha2::Digest;
use sha2::Sha256;
use std::cmp::min;
use uploader_canister::types::OperationType;

use candid::Principal;
use ic_cdk::management_canister::{
    canister_status, clear_chunk_store, install_chunked_code, update_settings, upload_chunk, CanisterInstallMode,
    CanisterSettings, CanisterStatusArgs, ChunkHash, ClearChunkStoreArgs, InstallChunkedCodeArgs, UpdateSettingsArgs,
    UploadChunkArgs,
};

pub(crate) async fn install_canister_code(
    operation_type: OperationType,
    canister_id: Principal,
    wasm_module: Vec<u8>,
    arg: Vec<u8>,
) -> Result<(), String> {
    let mut hasher = Sha256::new();
    hasher.update(&wasm_module);
    let wasm_module_hash = hasher.finalize().to_vec();

    let chunk_hashes_list = put_wasm_module(&canister_id, wasm_module).await?;

    let arg = InstallChunkedCodeArgs {
        mode: match operation_type {
            OperationType::InstallCode => CanisterInstallMode::Install,
            OperationType::ReInstallCode => CanisterInstallMode::Reinstall,
            OperationType::UpgradeCode => CanisterInstallMode::Upgrade(None),
        },
        target_canister: canister_id,
        store_canister: None,
        chunk_hashes_list,
        arg,
        wasm_module_hash,
    };

    install_chunked_code(&arg)
        .await
        .map_err(|error| format!("Error while installing canister code: {:?}", error))
}

pub async fn put_wasm_module(canister_id: &Principal, wasm_module: Vec<u8>) -> Result<Vec<ChunkHash>, String> {
    clear_chunk_store(&ClearChunkStoreArgs {
        canister_id: *canister_id,
    })
    .await
    .map_err(|error| format!("Error while clearing chunk store: {:?}", error))?;

    let chunk_size = 2_000_000;
    let mut from: usize = 0;
    let mut hashes = vec![];
    while from < wasm_module.len() {
        let to = min(from + chunk_size, wasm_module.len());

        let arg = UploadChunkArgs {
            canister_id: *canister_id,
            chunk: wasm_module[from..to].to_owned(),
        };

        let chunk_hash = upload_chunk(&arg)
            .await
            .map_err(|error| format!("Error while uploading chunk: {:?}", error))?;

        hashes.push(chunk_hash);
        from = to;
    }

    Ok(hashes)
}

pub(crate) async fn set_controllers(canister_id: Principal, controllers: Vec<Principal>) -> Result<(), String> {
    update_settings(&UpdateSettingsArgs {
        canister_id,
        settings: CanisterSettings {
            controllers: Some(controllers),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            wasm_memory_threshold: None,
            environment_variables: None,
        },
    })
    .await
    .map_err(|e| format!("{:?}", e))
}

pub(crate) async fn get_canister_status(canister_id: Principal) -> Result<String, String> {
    canister_status(&CanisterStatusArgs { canister_id })
        .await
        .map_err(|e| format!("{:?}", e))
        .map(|status| format!("{:?}", status))
}
