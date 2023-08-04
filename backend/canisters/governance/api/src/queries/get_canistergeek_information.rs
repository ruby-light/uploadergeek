use canistergeek_ic_rust::api_type::{GetInformationRequest, GetInformationResponse};

pub type Args = GetInformationRequest;
pub type Response = Option<GetInformationResponse<'static>>;
