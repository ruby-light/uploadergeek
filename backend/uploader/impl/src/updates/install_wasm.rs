use crate::guards::caller_is_service_principal;
use crate::management::install_canister_code;
use crate::{log_info, read_state};
use ic_cdk_macros::update;
use uploader_canister::install_wasm::*;

#[update(guard = "caller_is_service_principal")]
async fn install_wasm(args: Args) -> Response {
    match install_wasm_int(args).await {
        Ok(_) => Response::Ok,
        Err(error) => Response::Err(error),
    }
}

async fn install_wasm_int(args: Args) -> Result<(), InstallWasmError> {
    log_info!(
        "Install wasm, hash: {}, canister: {}",
        args.wasm_hash,
        args.canister_id.to_text()
    );

    let wasm = read_state(|state| {
        let uploaded_wasm = state.model.get_uploaded_wasm().ok_or(InstallWasmError::WrongState)?;

        if uploaded_wasm.hash != args.wasm_hash {
            return Err(InstallWasmError::WrongHash);
        }

        Ok(uploaded_wasm.wasm.clone())
    })?;

    install_canister_code(args.canister_id, wasm, args.arg)
        .await
        .map_err(|reason| InstallWasmError::InstallError { reason })
}
