use crate::generate_c2c_call;
use crate::management::install_code::InstallMode;
use candid::Principal;

pub(crate) async fn install_canister_code(
    upgrade: bool,
    canister_id: Principal,
    wasm_module: Vec<u8>,
    arg: Vec<u8>,
) -> Result<(), String> {
    let args = install_code::Args {
        mode: if upgrade { InstallMode::upgrade } else { InstallMode::install },
        canister_id,
        wasm_module,
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

pub(crate) async fn set_controllers(canister_id: Principal, controllers: Vec<Principal>) -> Result<(), String> {
    let args = update_settings::Args {
        canister_id,
        settings: update_settings::CanisterSettings {
            controllers: Some(controllers),
        },
    };

    update_settings(Principal::management_canister(), &args)
        .await
        .map_err(|e| format!("{:?}", e))
}

mod update_settings {
    use candid::{CandidType, Principal};
    use serde::Serialize;

    #[derive(CandidType, Serialize, Debug)]
    pub struct CanisterSettings {
        pub controllers: Option<Vec<Principal>>,
        // compute_allocation : Option<u> nat;
        // memory_allocation : opt nat;
        // freezing_threshold : opt nat;
    }

    #[derive(CandidType, Serialize, Debug)]
    pub struct UpdateSettings {
        pub canister_id: Principal,
        pub settings: CanisterSettings,
        // sender_canister_version : Option<u64>,
    }

    pub type Args = UpdateSettings;
    pub type Response = ();
}

generate_c2c_call!(update_settings);
