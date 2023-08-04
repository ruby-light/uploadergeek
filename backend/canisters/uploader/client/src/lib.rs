mod macros;
pub mod operations;

use uploader_canister::*;

// Queries
generate_query_call!(get_service_principals);
generate_query_call!(get_geek_user_principals);

// Updates
generate_update_call!(set_service_principals);
generate_update_call!(set_geek_user_principals);
generate_update_call!(set_operation_grant);
generate_update_call!(upload_wasm_chunk);
generate_update_call!(perform_operation);
