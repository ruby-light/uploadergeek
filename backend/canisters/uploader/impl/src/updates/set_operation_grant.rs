use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::set_operation_grant::*;
use uploader_canister::types::WasmProperties;

#[update(guard = "caller_is_service_principal")]
fn set_operation_grant(args: Args) -> Response {
    match set_operation_grant_int(args) {
        Ok(grant) => {
            log_info!("Set operation grant: {grant}");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not set operation grant: {error:?}");
            Response::Err(error)
        }
    }
}

fn set_operation_grant_int(args: Args) -> Result<String, SetOperationGrantError> {
    let grant = args.grant;
    if let Some(grant) = &grant {
        validate_wasm_properties(&grant.wasm_properties)?;
    }

    mutate_state(|state| {
        state.model.set_operation_grant(grant.clone());
        Ok(format!("{:?}", state.model.get_operation_grant()))
    })
}

fn validate_wasm_properties(wasm_properties: &WasmProperties) -> Result<(), SetOperationGrantError> {
    if let Some(wasm_length) = wasm_properties.wasm_length {
        if wasm_length > 100_000_000 {
            return Err(SetOperationGrantError::WrongWasmLength);
        }
    }
    Ok(())
}
