use crate::guards::caller_is_operator;
use crate::{log_error, log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::upload_wasm_chunk::*;

#[update(guard = "caller_is_operator")]
fn upload_wasm_chunk(args: Args) -> Response {
    match upload_wasm_chunk_int(args) {
        Ok(result) => {
            log_info!("Upload wasm chunk: {result:?}");
            Response::Ok(result)
        }
        Err(error) => {
            log_error!("Can not put chunk ctx: {error:?}");
            Response::Err(error)
        }
    }
}

fn upload_wasm_chunk_int(args: Args) -> Result<UploadWasmChunkResult, UploadWasmChunkError> {
    let first = args.first;
    let chunk = args.chunk;

    validate_overflow(first, &chunk)?;

    mutate_state(|state| {
        let wasm_module = state.model.get_wasm_module();
        if first {
            wasm_module.clear();
        }
        wasm_module.extend(chunk);

        Ok(UploadWasmChunkResult {
            length: wasm_module.len(),
        })
    })
}

fn validate_overflow(first: bool, chunk: &[u8]) -> Result<(), UploadWasmChunkError> {
    let (wasm_length, current_length) = mutate_state(|state| {
        (
            state.model.get_operation_grant().unwrap().wasm_properties.wasm_length,
            state.model.get_wasm_module().len(),
        )
    });

    let mut new_size = chunk.len();
    if !first {
        new_size += current_length;
    };

    if new_size > wasm_length.unwrap_or(100_000_000) {
        return Err(UploadWasmChunkError::WasmLengthOverflow);
    }

    Ok(())
}
