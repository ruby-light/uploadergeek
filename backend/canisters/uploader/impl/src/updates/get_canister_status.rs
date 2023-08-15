use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info, management};
use ic_cdk_macros::update;
use uploader_canister::get_canister_status::*;

#[update(guard = "caller_is_service_principal")]
async fn get_canister_status(args: Args) -> Response {
    match management::get_canister_status(args.canister_id).await {
        Ok(result) => {
            log_info!("Success perform get canister status!");
            GetCanisterStatusResponse::Ok(GetCanisterStatusResult { status: result })
        }
        Err(error) => {
            log_error!("Can not perform call get canister status: {error:?}");
            GetCanisterStatusResponse::Err(GetCanisterStatusError::CallError { reason: error })
        }
    }
}
