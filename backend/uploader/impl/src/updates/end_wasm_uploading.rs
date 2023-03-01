use crate::guards::caller_is_service_principal;
use crate::{log_info, mutate_state};
use ic_cdk_macros::update;
use sha2::{Digest, Sha256};
use uploader_canister::end_wasm_uploading::*;

#[update(guard = "caller_is_service_principal")]
fn end_wasm_uploading(args: Args) -> Response {
    log_info!("End wasm uploading, hash: {}", args.wasm_hash);

    mutate_state(|state| match state.model.get_uploading_wasm() {
        None => Response::Err(EndWasmUploadError::WrongState),
        Some(uploading_wasm) => {
            let wasm_hash = get_wasm_hash(uploading_wasm);
            if wasm_hash != args.wasm_hash {
                return Response::Err(EndWasmUploadError::WrongHash);
            }

            state.model.set_uploaded_wasm(wasm_hash);
            Response::Ok
        }
    })
}

pub(crate) fn get_wasm_hash(wasm: &Vec<u8>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(wasm);
    format!("{:x}", hasher.finalize())
}
