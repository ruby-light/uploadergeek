use crate::guards::caller_is_service_principal;
use crate::{log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::set_geek_user_principals::*;

#[update(guard = "caller_is_service_principal")]
fn set_geek_user_principals(args: Args) -> Response {
    log_info!(
        "Set geek user principals: {:?}",
        &args.geek_user_principals.iter().map(|p| p.to_text()).collect::<Vec<String>>()
    );

    mutate_state(|state| {
        state.model.set_geek_user_principals(args.geek_user_principals);
    });

    Response::Ok
}
