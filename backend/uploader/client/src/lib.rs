mod macros;
pub mod operations;

use uploader_canister::*;

// Queries
generate_query_call!(get_service_principals);
generate_query_call!(get_uploaded_wasm);

// Updates
generate_update_call!(set_service_principals);
generate_update_call!(start_wasm_uploading);
generate_update_call!(put_wasm_chunk);
generate_update_call!(end_wasm_uploading);
generate_update_call!(install_wasm);
generate_update_call!(upgrade_wasm);
