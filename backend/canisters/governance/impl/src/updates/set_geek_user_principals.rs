use crate::guards::caller_is_geek_user;
use crate::{log_error, log_info, mutate_state};
use candid::Principal;
use governance_canister::set_geek_user_principals::*;
use ic_cdk::api::msg_caller;
use ic_cdk_macros::update;

#[update(guard = "caller_is_geek_user")]
fn set_geek_user_principals(args: Args) -> Response {
    match set_geek_user_principals_int(args) {
        Ok(principals) => {
            log_info!("Set geek user principals: {principals}");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not set geek user principals: {error:?}");
            Response::Err(error)
        }
    }
}

fn set_geek_user_principals_int(args: Args) -> Result<String, SetGeekUserPrincipalsError> {
    let new_principals = args.geek_user_principals;
    validate_new_principals(&new_principals)?;

    mutate_state(|state| {
        state.model.geek_user_storage.set_geek_user_principals(new_principals);

        Ok(format!(
            "{:?}",
            state
                .model
                .geek_user_storage
                .get_geek_user_principals()
                .iter()
                .map(|p| p.to_text())
                .collect::<Vec<String>>()
        ))
    })
}

fn validate_new_principals(new_principals: &[Principal]) -> Result<(), SetGeekUserPrincipalsError> {
    if new_principals.contains(&msg_caller()) {
        Ok(())
    } else {
        Err(SetGeekUserPrincipalsError::LoseControlDangerous)
    }
}
