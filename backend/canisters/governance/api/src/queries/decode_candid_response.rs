use candid::CandidType;
use serde::Deserialize;

pub type Args = DecodeCandidResponseArgs;
pub type Response = DecodeCandidResponseResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct DecodeCandidResponseArgs {
    pub canister_did: String,
    pub method: String,
    pub response: String,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum DecodeCandidResponseResponse {
    Ok(DecodeCandidResponseResult),
    Err(DecodeCandidResponseError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct DecodeCandidResponseResult {
    pub candid: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum DecodeCandidResponseError {
    DecodeError { error: String },
    ParseError { error: String },
}

impl From<Result<DecodeCandidResponseResult, DecodeCandidResponseError>> for DecodeCandidResponseResponse {
    fn from(result: Result<DecodeCandidResponseResult, DecodeCandidResponseError>) -> Self {
        match result {
            Ok(ok) => DecodeCandidResponseResponse::Ok(ok),
            Err(err) => DecodeCandidResponseResponse::Err(err),
        }
    }
}
