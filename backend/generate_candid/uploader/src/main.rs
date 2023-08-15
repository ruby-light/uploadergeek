use icgeek_candid_gen::*;

#[allow(deprecated)]
fn main() {
    generate_update_candid_method!(uploader_canister, get_canister_status);
    generate_update_candid_method!(uploader_canister, set_service_principals);
    generate_update_candid_method!(uploader_canister, set_geek_user_principals);
    generate_update_candid_method!(uploader_canister, set_operation_grant);
    generate_update_candid_method!(uploader_canister, upload_wasm_chunk);
    generate_update_candid_method!(uploader_canister, perform_operation);
    generate_update_candid_method!(uploader_canister, perform_call);
    generate_update_candid_method!(uploader_canister, set_controllers);
    generate_update_candid_method!(
        uploader_canister,
        update_canistergeek_information,
        Args,
        Stub,
        updateCanistergeekInformation
    );

    generate_query_candid_method!(uploader_canister, get_service_principals);
    generate_query_candid_method!(uploader_canister, get_geek_user_principals);
    generate_query_candid_method!(
        uploader_canister,
        get_canistergeek_information,
        Args,
        Response,
        getCanistergeekInformation
    );

    candid::export_service!();

    std::print!("{}", __export_service());
}
