use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info};
use ic_cdk_macros::update;
use uploader_canister::perform_call::*;

#[update(guard = "caller_is_service_principal")]
async fn perform_call(args: Args) -> Response {
    match perform_call_int(args).await {
        Ok(result) => {
            log_info!("Success perform call!");
            Response::Ok(result)
        }
        Err(error) => {
            log_error!("Can not perform call: {error:?}");
            Response::Err(error)
        }
    }
}

async fn perform_call_int(args: PerformCallArgs) -> Result<PerformCallResult, PerformCallError> {
    let canister_id = args.canister_id;
    let method = args.method;
    let method_args = args.args;

    ic_cdk::call::Call::bounded_wait(canister_id, method.as_str())
        .with_raw_args(method_args.as_slice())
        .await
        .map(|result| PerformCallResult {
            result: result.into_bytes(),
        })
        .map_err(|error| PerformCallError::CallError {
            reason: format!("{error:?}"),
        })

    // let result = ic_cdk::api::call::call_raw(canister_id, method.as_str(), method_args, 0)
    // .await
    // .map_err(|error| PerformCallError::CallError {
    // reason: format!("{error:?}"),
    // })?;
    //
    // Ok(PerformCallResult { result })
}
