use icgeek_candid_gen::*;

fn main() {
    generate_update_candid_method!(uploader_canister, set_service_principals);
    generate_update_candid_method!(uploader_canister, set_geek_user_principals);
    generate_update_candid_method!(uploader_canister, start_wasm_uploading);
    generate_update_candid_method!(uploader_canister, put_wasm_chunk);
    generate_update_candid_method!(uploader_canister, end_wasm_uploading);
    generate_update_candid_method!(uploader_canister, install_wasm);
    generate_update_candid_method!(uploader_canister, upgrade_wasm);
    generate_update_candid_method!(
        uploader_canister,
        update_canistergeek_information,
        Args,
        Stub,
        updateCanistergeekInformation
    );

    generate_query_candid_method!(uploader_canister, get_service_principals);
    generate_query_candid_method!(uploader_canister, get_geek_user_principals);
    generate_query_candid_method!(uploader_canister, get_uploaded_wasm);
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
