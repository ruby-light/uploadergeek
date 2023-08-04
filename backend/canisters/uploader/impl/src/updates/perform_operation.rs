use crate::guards::caller_is_operator;
use crate::management::install_canister_code;
use crate::{log_error, log_info, mutate_state};
use ic_cdk_macros::update;
use sha2::Digest;
use sha2::Sha256;
use uploader_canister::perform_operation::*;
use uploader_canister::types::{OperationType, WasmProperties};

#[update(guard = "caller_is_operator")]
async fn perform_operation(_args: Args) -> Response {
    match perform_operation_int().await {
        Ok(_) => {
            log_info!("Success perform operation!");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not perform operation: {error:?}");
            Response::Err(error)
        }
    }
}

async fn perform_operation_int() -> Result<(), PerformOperationError> {
    let (grant, wasm_module) = mutate_state(|state| {
        (
            state.model.get_operation_grant().cloned().unwrap(),
            state.model.get_wasm_module().clone(),
        )
    });

    validate_perform_operation(&grant.wasm_properties, &wasm_module)?;

    install_canister_code(
        matches!(grant.operation_type, OperationType::UpgradeCode),
        grant.canister_id,
        wasm_module,
        grant.arg,
    )
    .await
    .map_err(|reason| PerformOperationError::OperationError { reason })?;

    mutate_state(|state| {
        state.model.set_operation_grant(None);
    });

    Ok(())
}

fn validate_perform_operation(wasm_properties: &WasmProperties, wasm_module: &Vec<u8>) -> Result<(), PerformOperationError> {
    if let Some(wasm_length) = wasm_properties.wasm_length {
        let length = wasm_module.len();
        if length != wasm_length {
            return Err(PerformOperationError::WrongWasmLength { length });
        }
    }

    let hash = get_module_hash(wasm_module);
    if hash != wasm_properties.wasm_hash {
        return Err(PerformOperationError::WrongWasmHash { hash });
    }

    Ok(())
}

fn get_module_hash(module: &Vec<u8>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(module);
    format!("{:x}", hasher.finalize())
}
