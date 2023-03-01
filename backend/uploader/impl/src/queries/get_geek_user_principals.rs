use crate::read_state;
use ic_cdk_macros::query;
use uploader_canister::get_geek_user_principals::*;

#[query]
fn get_geek_user_principals(_args: Args) -> Response {
    read_state(|state| {
        Response::Ok(GetGeekUserPrincipalsResult {
            geek_user_principals: state.model.get_geek_user_principals().iter().copied().collect(),
        })
    })
}
