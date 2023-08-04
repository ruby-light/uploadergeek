use crate::guards::caller_is_geek_user;
use ic_cdk_macros::query;

#[query(name = "getCanistergeekInformation", guard = "caller_is_geek_user")]
pub fn get_canistergeek_information(
    parameters: canistergeek_ic_rust::api_type::GetInformationRequest,
) -> canistergeek_ic_rust::api_type::GetInformationResponse<'static> {
    canistergeek_ic_rust::get_information(parameters)
}
