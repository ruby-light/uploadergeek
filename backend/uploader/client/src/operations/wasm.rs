use std::fs::File;
use std::io::Read;
use std::path::PathBuf;

pub fn get_canister_wasm(canister_name: String) -> Vec<u8> {
    let file_name = canister_name + "_canister_impl-opt.wasm";
    read_file_from_local_bin(&file_name)
}

pub fn read_file_from_local_bin(file_name: &str) -> Vec<u8> {
    let mut file_path =
        PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").expect("Failed to read CARGO_MANIFEST_DIR env variable"));

    file_path.push("local-bin");
    file_path.push(file_name);

    let mut file = File::open(&file_path).unwrap_or_else(|_| panic!("Failed to open file: {}", file_path.to_str().unwrap()));

    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).expect("Failed to read file");

    bytes
}
