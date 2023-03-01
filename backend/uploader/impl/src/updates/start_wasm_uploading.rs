use crate::guards::caller_is_service_principal;
use crate::{log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::start_wasm_uploading::*;

#[update(guard = "caller_is_service_principal")]
fn start_wasm_uploading(args: Args) -> Response {
    log_info!("Start wasm upload: {:?}", args);

    mutate_state(|state| {
        state.model.start_wasm_upload();
    });

    Response::Ok
}
