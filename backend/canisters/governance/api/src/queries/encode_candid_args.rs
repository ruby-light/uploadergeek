use candid::CandidType;
use serde::Deserialize;

pub type Args = EncodeCandidArgsArgs;
pub type Response = EncodeCandidArgsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct EncodeCandidArgsArgs {
    pub candid: String,
}

#[allow(clippy::large_enum_variant)]
#[derive(CandidType, Deserialize, Debug)]
pub enum EncodeCandidArgsResponse {
    Ok(EncodeCandidArgsResult),
    Err(EncodeCandidArgsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct EncodeCandidArgsResult {
    pub slice: Vec<u8>,
    pub hex: String,
    pub blob: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum EncodeCandidArgsError {
    ParseError { error: String },
    DecodeError { error: String },
}

impl From<Result<EncodeCandidArgsResult, EncodeCandidArgsError>> for EncodeCandidArgsResponse {
    fn from(result: Result<EncodeCandidArgsResult, EncodeCandidArgsError>) -> Self {
        match result {
            Ok(ok) => EncodeCandidArgsResponse::Ok(ok),
            Err(err) => EncodeCandidArgsResponse::Err(err),
        }
    }
}
