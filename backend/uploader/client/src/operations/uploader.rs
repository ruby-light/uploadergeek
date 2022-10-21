use candid::Principal;
use ic_agent::Agent;
use sha2::{Digest, Sha256};
use std::cmp::min;
use uploader_canister::end_wasm_uploading::{EndWasmUploadArgs, EndWasmUploadResponse};
use uploader_canister::install_wasm::{InstallWasmArgs, InstallWasmResponse};
use uploader_canister::put_wasm_chunk::{PutWasmChunkArgs, PutWasmChunkResponse};
use uploader_canister::start_wasm_uploading::StartWasmUploadArgs;
use uploader_canister::upgrade_wasm::{UpgradeWasmArgs, UpgradeWasmResponse};

pub async fn install_wasm_over_uploader(
    agent: &Agent,
    uploader_canister_id: &Principal,
    canister_id: Principal,
    wasm: Vec<u8>,
    arg: Vec<u8>,
) {
    let wasm_hash = put_wasm_to_uploader(agent, uploader_canister_id, wasm)
        .await
        .unwrap_or_else(|error| panic!("{}", error));

    match crate::install_wasm(
        agent,
        uploader_canister_id,
        &InstallWasmArgs {
            wasm_hash,
            canister_id,
            arg,
        },
    )
    .await
    {
        Ok(InstallWasmResponse::Ok) => {}
        response => {
            panic!("Error while install wasm: {:?}", response)
        }
    }
}

pub async fn upgrade_wasm_over_uploader(
    agent: &Agent,
    uploader_canister_id: &Principal,
    canister_id: Principal,
    wasm: Vec<u8>,
    arg: Vec<u8>,
) {
    let wasm_hash = put_wasm_to_uploader(agent, uploader_canister_id, wasm)
        .await
        .unwrap_or_else(|error| panic!("{}", error));

    match crate::upgrade_wasm(
        agent,
        uploader_canister_id,
        &UpgradeWasmArgs {
            wasm_hash,
            canister_id,
            arg,
        },
    )
    .await
    {
        Ok(UpgradeWasmResponse::Ok) => {}
        response => {
            panic!("Error while upgrade wasm: {:?}", response)
        }
    }
}

pub async fn put_wasm_to_uploader(agent: &Agent, uploader_canister_id: &Principal, wasm: Vec<u8>) -> Result<String, String> {
    println!("Start wasm uploading");

    crate::start_wasm_uploading(agent, uploader_canister_id, &StartWasmUploadArgs {})
        .await
        .map_err(|error| format!("Error while start wasm upload: {:?}", error))?;

    let mut from: usize = 0;
    while from < wasm.len() {
        let to = min(from + 2_000_000, wasm.len());

        println!("Put wasm cnunk [{}..{}]", from, to);

        match crate::put_wasm_chunk(
            agent,
            uploader_canister_id,
            &PutWasmChunkArgs {
                chunk: wasm[from..to].to_owned(),
            },
        )
        .await
        {
            Ok(PutWasmChunkResponse::Ok) => {}
            response => {
                return Err(format!("Error while put wasm chunk: {:?}", response));
            }
        }
        from = to;
    }

    let hash = get_module_hash(&wasm);

    println!("End wasm uploading");

    let hash =
        match crate::end_wasm_uploading(agent, uploader_canister_id, &EndWasmUploadArgs { wasm_hash: hash.clone() }).await {
            Ok(EndWasmUploadResponse::Ok) => Ok(hash),
            response => Err(format!("Error while end wasm upload: {:?}", response)),
        }?;

    println!("Wasm uploaded with hash: {}", &hash);

    Ok(hash)
}

pub fn get_module_hash(module: &Vec<u8>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(module);
    format!("{:x}", hasher.finalize())
}
