use crate::read_state;
use governance_canister::get_geek_user_principals::*;
use ic_cdk_macros::query;

#[query]
fn get_geek_user_principals(_args: Args) -> Response {
    read_state(|state| {
        Response::Ok(GetGeekUserPrincipalsResult {
            geek_user_principals: state
                .model
                .geek_user_storage
                .get_geek_user_principals()
                .iter()
                .copied()
                .collect(),
        })
    })
}
