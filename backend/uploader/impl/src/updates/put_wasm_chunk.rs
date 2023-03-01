use crate::guards::caller_is_service_principal;
use crate::{log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::put_wasm_chunk::*;

#[update(guard = "caller_is_service_principal")]
fn put_wasm_chunk(args: Args) -> Response {
    log_info!("Put wasm chunk with size: {:?}", args.chunk.len());

    mutate_state(|state| {
        if state.model.get_uploading_wasm().is_some() {
            state.model.put_wasm_chunk(args.chunk);
            Response::Ok
        } else {
            Response::Err(PutWasmChunkError::WrongState)
        }
    })
}
