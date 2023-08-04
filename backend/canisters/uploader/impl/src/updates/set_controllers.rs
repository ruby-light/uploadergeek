use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info, management};
use candid::Principal;
use ic_cdk_macros::update;
use uploader_canister::set_controllers::*;

#[update(guard = "caller_is_service_principal")]
async fn set_controllers(args: Args) -> Response {
    match set_controllers_int(args).await {
        Ok(controllers) => {
            log_info!("Set controllers: {controllers}!");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not set controllers: {error:?}");
            Response::Err(error)
        }
    }
}

async fn set_controllers_int(args: SetControllersArgs) -> Result<String, SetControllersError> {
    let canister_id = args.canister_id;
    let new_controllers = args.controllers;

    validate_new_controllers(&new_controllers)?;

    let result = format!("{:?}", new_controllers.iter().map(|p| p.to_text()).collect::<Vec<String>>());

    management::set_controllers(canister_id, new_controllers)
        .await
        .map_err(|error| SetControllersError::OperationError { reason: error })?;

    Ok(result)
}

fn validate_new_controllers(new_controllers: &[Principal]) -> Result<(), SetControllersError> {
    if new_controllers.contains(&ic_cdk::caller()) {
        Ok(())
    } else {
        Err(SetControllersError::LoseControllerDangerous)
    }
}
