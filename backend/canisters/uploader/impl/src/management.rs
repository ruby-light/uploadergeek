use candid::Principal;
use ic_cdk::api::management_canister::main::{
    CanisterIdRecord, CanisterInstallMode, CanisterSettings, InstallCodeArgument, UpdateSettingsArgument,
};

pub(crate) async fn install_canister_code(
    upgrade: bool,
    canister_id: Principal,
    wasm_module: Vec<u8>,
    arg: Vec<u8>,
) -> Result<(), String> {
    ic_cdk::api::management_canister::main::install_code(InstallCodeArgument {
        mode: if upgrade { CanisterInstallMode::Upgrade(None) } else { CanisterInstallMode::Install },
        canister_id,
        wasm_module,
        arg,
    })
    .await
    .map_err(|e| format!("{:?}", e))
}

pub(crate) async fn set_controllers(canister_id: Principal, controllers: Vec<Principal>) -> Result<(), String> {
    ic_cdk::api::management_canister::main::update_settings(UpdateSettingsArgument {
        canister_id,
        settings: CanisterSettings {
            controllers: Some(controllers),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
        },
    })
    .await
    .map_err(|e| format!("{:?}", e))
}

pub(crate) async fn get_canister_status(canister_id: Principal) -> Result<String, String> {
    ic_cdk::api::management_canister::main::canister_status(CanisterIdRecord { canister_id })
        .await
        .map_err(|e| format!("{:?}", e))
        .map(|status| format!("{:?}", status.0))
}
