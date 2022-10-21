use crate::guards::caller_is_service_principal;
use crate::mutate_state;
use ic_cdk_macros::update;
use uploader_canister::start_wasm_uploading::*;

#[update(guard = "caller_is_service_principal")]
fn start_wasm_uploading(args: Args) -> Response {
    ic_cdk::print(format!("Start wasm upload: {:?}", args));

    mutate_state(|state| {
        state.model.start_wasm_upload();
    });

    Response::Ok
}
