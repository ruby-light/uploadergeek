use crate::guards::caller_is_service_principal;
use crate::{log_error, log_info, mutate_state};
use ic_cdk_macros::update;
use uploader_canister::set_operation_grant::*;
use uploader_canister::types::WasmProperties;

#[update(guard = "caller_is_service_principal")]
fn set_operation_grant(args: Args) -> Response {
    match set_operation_grant_int(args) {
        Ok(grant) => {
            log_info!("Set operation grant: {grant}");
            Response::Ok
        }
        Err(error) => {
            log_error!("Can not set operation grant: {error:?}");
            Response::Err(error)
        }
    }
}

fn set_operation_grant_int(args: Args) -> Result<String, SetOperationGrantError> {
    let grant = args.grant;
    if let Some(grant) = &grant {
        validate_wasm_properties(&grant.wasm_properties)?;
    }

    mutate_state(|state| {
        state.model.set_operation_grant(grant.clone());
        Ok(format!("{:?}", state.model.get_operation_grant()))
    })
}

fn validate_wasm_properties(wasm_properties: &WasmProperties) -> Result<(), SetOperationGrantError> {
    if let Some(wasm_length) = wasm_properties.wasm_length {
        if wasm_length > 100_000_000 {
            return Err(SetOperationGrantError::WrongWasmLength);
        }
    }
    Ok(())
}

// fn validate_candid(candid: &str) -> Result<(), SetOperationGrantError> {
//     let map_error = |e: _| SetOperationGrantError::WrongArgCandid {
//         reason: format!("{e:?}"),
//     };
//
//     let args: IDLArgs = candid.parse().map_err(map_error)?;
//     args.to_bytes().map_err(map_error)?;
//     Ok(())
// }

// #[cfg(test)]
// mod tests {
//     use candid::Decode;
//     use uploader_canister::types::WasmProperties;
//
//     #[test]
//     fn test() {
//         use candid::{IDLArgs, TypeEnv};
//
//         // Candid values represented in text format
//         let text_value = r#"
//      (record {wasm_length=123 : nat32; wasm_hash="haha"; arg_candid="aaa"})
// "#;
//
//         // Parse text format into IDLArgs for serialization
//         let args: IDLArgs = text_value.parse().expect("");
//         let encoded: Vec<u8> = args.to_bytes().expect("");
//         println!(">>>> {:?}", encoded);
//
//         // Deserialize into IDLArgs
//         let decoded: IDLArgs = IDLArgs::from_bytes(&encoded).expect("");
//         assert_eq!(encoded, decoded.to_bytes().expect(""));
//
//         // Convert IDLArgs to text format
//         let output: String = decoded.to_string();
//         println!(">>>> {:?}", output);
//         let parsed_args: IDLArgs = output.parse().expect("");
//         let annotated_args = args
//             .annotate_types(true, &TypeEnv::new(), &parsed_args.get_types())
//             .expect("");
//         assert_eq!(annotated_args, parsed_args);
//
//         let wp = Decode!(&encoded, WasmProperties).expect("ss");
//         println!(">>>> {:?}", wp);
//     }
// }
