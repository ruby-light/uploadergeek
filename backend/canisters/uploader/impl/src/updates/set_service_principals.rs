use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info, mutate_state};
use candid::Principal;
use ic_cdk::api::msg_caller;
use ic_cdk_macros::update;
use uploader_canister::set_service_principals::*;

#[update(guard = "caller_is_service_principal")]
fn set_service_principals(args: Args) -> Response {
    match set_service_principals_int(args) {
        Ok(principals) => {
            log_info!("Set service principals: {principals}");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not set service principals: {error:?}");
            Response::Err(error)
        }
    }
}

fn set_service_principals_int(args: Args) -> Result<String, SetServicePrincipalsError> {
    let new_principals = args.service_principals;
    validate_new_principals(&new_principals)?;

    mutate_state(|state| {
        state.model.set_service_principals(new_principals);

        Ok(format!(
            "{:?}",
            state
                .model
                .get_service_principals()
                .iter()
                .map(|p| p.to_text())
                .collect::<Vec<String>>()
        ))
    })
}

fn validate_new_principals(new_principals: &[Principal]) -> Result<(), SetServicePrincipalsError> {
    if new_principals.contains(&msg_caller()) {
        Ok(())
    } else {
        Err(SetServicePrincipalsError::LoseControlDangerous)
    }
}
