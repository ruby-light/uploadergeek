use candid_gen::generate_candid_method;

fn main() {
    generate_candid_method!(uploader, start_wasm_uploading, update);
    generate_candid_method!(uploader, put_wasm_chunk, update);
    generate_candid_method!(uploader, end_wasm_uploading, update);
    generate_candid_method!(uploader, install_wasm, update);
    generate_candid_method!(uploader, upgrade_wasm, update);
    generate_candid_method!(uploader, set_service_principals, update);

    generate_candid_method!(uploader, get_uploaded_wasm, query);
    generate_candid_method!(uploader, get_service_principals, query);

    candid::export_service!();
    std::print!("{}", __export_service());
}
