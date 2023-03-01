pub mod get_canistergeek_information;
pub mod get_geek_user_principals;
pub mod get_service_principals;
pub mod get_uploaded_wasm;

#[derive(candid::CandidType, serde::Deserialize, Debug)]
pub struct EmptyArgs {}
