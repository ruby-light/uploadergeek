use crate::guards::caller_is_service_principal;
use crate::mutate_state;
use ic_cdk_macros::update;
use uploader_canister::set_service_principals::*;

#[update(guard = "caller_is_service_principal")]
fn set_service_principals(args: Args) -> Response {
    ic_cdk::print(format!("Set service principals: {:?}", &args.service_principals
        .iter()
        .map(|p| p.to_text())
        .collect::<Vec<String>>()
    ));

    mutate_state(|state| {
        if args.service_principals.contains(&ic_cdk::caller()) {
            state.model.set_service_principals(args.service_principals);
            Response::Ok
        } else {
            Response::Err(SetServicePrincipalError::Inconsistency)
        }
    })
}
