use crate::management::install_code::InstallMode;
use candid::Principal;
use canister_client_macros::generate_c2c_call;

pub(crate) async fn install_canister_code(canister_id: Principal, module: Vec<u8>, arg: Vec<u8>) -> Result<(), String> {
    let args = install_code::Args {
        mode: InstallMode::install,
        canister_id,
        wasm_module: module,
        arg,
    };

    install_code(Principal::management_canister(), &args)
        .await
        .map_err(|e| format!("{:?}", e))
}

pub(crate) async fn upgrade_canister_code(canister_id: Principal, module: Vec<u8>, arg: Vec<u8>) -> Result<(), String> {
    let args = install_code::Args {
        mode: InstallMode::upgrade,
        canister_id,
        wasm_module: module,
        arg,
    };

    install_code(Principal::management_canister(), &args)
        .await
        .map_err(|e| format!("{:?}", e))
}

mod install_code {
    use candid::{CandidType, Principal};
    use serde::Serialize;

    #[derive(CandidType, Serialize, Debug)]
    #[allow(non_camel_case_types)]
    pub enum InstallMode {
        install,
        upgrade,
    }

    #[derive(CandidType, Serialize, Debug)]
    pub struct InstallCodeArgs {
        pub mode: InstallMode,
        pub canister_id: Principal,
        pub wasm_module: Vec<u8>,
        pub arg: Vec<u8>,
    }

    pub type Args = InstallCodeArgs;
    pub type Response = ();
}

generate_c2c_call!(install_code);
