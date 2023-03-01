use crate::guards::caller_is_service_principal;
use crate::management::upgrade_canister_code;
use crate::{log_info, read_state};
use ic_cdk_macros::update;
use uploader_canister::upgrade_wasm::*;

#[update(guard = "caller_is_service_principal")]
async fn upgrade_wasm(args: Args) -> Response {
    match upgrade_wasm_int(args).await {
        Ok(_) => Response::Ok,
        Err(error) => Response::Err(error),
    }
}

async fn upgrade_wasm_int(args: Args) -> Result<(), UpgradeWasmError> {
    log_info!(
        "Upgrade wasm, hash: {}, canister: {}",
        args.wasm_hash,
        args.canister_id.to_text()
    );

    let wasm = read_state(|state| {
        let uploaded_wasm = state.model.get_uploaded_wasm().ok_or(UpgradeWasmError::WrongState)?;

        if uploaded_wasm.hash != args.wasm_hash {
            return Err(UpgradeWasmError::WrongHash);
        }

        Ok(uploaded_wasm.wasm.clone())
    })?;

    upgrade_canister_code(args.canister_id, wasm, args.arg)
        .await
        .map_err(|reason| UpgradeWasmError::UpgradeError { reason })
}
