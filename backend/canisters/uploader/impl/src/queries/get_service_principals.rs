use crate::read_state;
use ic_cdk_macros::query;
use uploader_canister::get_service_principals::*;

#[query]
fn get_service_principals(_args: Args) -> Response {
    read_state(|state| {
        Response::Ok(GetServicePrincipalsResult {
            service_principals: state.model.get_service_principals().iter().copied().collect(),
        })
    })
}
