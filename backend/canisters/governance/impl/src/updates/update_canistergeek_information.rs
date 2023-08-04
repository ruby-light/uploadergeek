use crate::guards::caller_is_geek_user;
use canistergeek_ic_rust::api_type::UpdateInformationRequest;
use ic_cdk_macros::update;

#[update(name = "updateCanistergeekInformation", guard = "caller_is_geek_user")]
pub async fn update_canistergeek_information(request: UpdateInformationRequest) {
    canistergeek_ic_rust::update_information(request);
}
