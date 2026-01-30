use candid::IDLValue;
use candid_parser::parse_idl_args;
use governance_canister::encode_candid_args::*;
use ic_cdk_macros::query;

#[query]
fn encode_candid_args(Args { candid }: Args) -> Response {
    encode_candid_args_int(candid).into()
}

pub(crate) fn encode_candid_args_int(candid: String) -> Result<EncodeCandidArgsResult, EncodeCandidArgsError> {
    let r = parse_idl_args(candid.as_str()).map_err(|error| EncodeCandidArgsError::ParseError {
        error: format!("{}", error),
    })?;

    let slice = r.to_bytes().map_err(|error| EncodeCandidArgsError::DecodeError {
        error: format!("{}", error),
    })?;

    let hex = hex::encode(&slice);
    let blob = IDLValue::Blob(slice.clone()).to_string();

    Ok(EncodeCandidArgsResult { slice, hex, blob })
}

#[cfg(test)]
mod tests {
    use candid::{Decode, Encode, Principal};
    use ic_cdk::management_canister::{CanisterSettings, UpdateSettingsArgs};

    use crate::queries::encode_candid_args::encode_candid_args_int;

    #[test]
    fn test_encode() {
        let candid = r#"(
        record {
            canister_id  = principal "ky5rw-3aaaa-aaaac-qdvwa-cai";
            settings = record {
                controllers = opt vec { principal "6cbt4-ztfyf-7ldym-o2owg-geomw-bkgiy-uuzey-dq4ad-hsly3-txpo7-3qe";};
            };
        }
        )"#;

        let result = encode_candid_args_int(candid.to_string()).unwrap();
        assert_eq!(result.hex, "4449444c046c02b3c4b1f20468e3f9f5d908016c01d7e09b9002026e036d680100010a0000000000501d6c01010101011d65c17eb1e18ed3ac6311ccb054646294c9303870033c978dceef77f702");
        assert_eq!(
            result.blob,
            r#"blob "\44\49\44\4c\04\6c\02\b3\c4\b1\f2\04\68\e3\f9\f5\d9\08\01\6c\01\d7\e0\9b\90\02\02\6e\03\6d\68\01\00\01\0a\00\00\00\00\00\50\1d\6c\01\01\01\01\01\1d\65\c1\7e\b1\e1\8e\d3\ac\63\11\cc\b0\54\64\62\94\c9\30\38\70\03\3c\97\8d\ce\ef\77\f7\02""#
        );

        let decoded1 = Decode!(&result.slice, UpdateSettingsArgs).unwrap();

        let arg = UpdateSettingsArgs {
            canister_id: Principal::from_text("ky5rw-3aaaa-aaaac-qdvwa-cai").unwrap(),
            settings: CanisterSettings {
                controllers: Some(vec![Principal::from_text(
                    "6cbt4-ztfyf-7ldym-o2owg-geomw-bkgiy-uuzey-dq4ad-hsly3-txpo7-3qe",
                )
                .unwrap()]),
                compute_allocation: None,
                memory_allocation: None,
                freezing_threshold: None,
                reserved_cycles_limit: None,
                log_visibility: None,
                wasm_memory_limit: None,
                wasm_memory_threshold: None,
                environment_variables: None,
            },
        };

        let slice = Encode!(&arg).unwrap();
        let decoded2 = Decode!(&slice, UpdateSettingsArgs).unwrap();
        assert_eq!(decoded1, decoded2);
    }
}
