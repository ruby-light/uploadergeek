use crate::guards::caller_is_service_principal;
use crate::read_state;
use ic_cdk_macros::query;
use uploader_canister::get_uploaded_wasm::*;

#[query(guard = "caller_is_service_principal")]
fn get_uploaded_wasm(_args: Args) -> Response {
    read_state(|state| match state.model.get_uploaded_wasm() {
        None => Response::Err(GetUploadedWasmError::WrongState),
        Some(uploaded_wasm) => Response::Ok(GetUploadedWasmResult {
            len: uploaded_wasm.wasm.len(),
            wasm_hash: uploaded_wasm.hash.clone(),
        }),
    })
}
