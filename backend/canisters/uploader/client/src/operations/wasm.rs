use std::fs::File;
use std::io::Read;

pub(crate) fn get_canister_wasm(wasm_path: &str) -> Result<Vec<u8>, String> {
    let mut file = File::open(wasm_path).map_err(|error| format!("Failed to open wasm file {wasm_path}: {error:?}"))?;

    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)
        .map_err(|error| format!("Failed to read wasm file {wasm_path}: {error:?}"))?;

    Ok(bytes)
}
