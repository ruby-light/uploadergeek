use candid::{CandidType, Principal};
use ic_agent::Agent;
use ic_utils::call::AsyncCall;
use ic_utils::interfaces::management_canister::builders::InstallMode;
use ic_utils::interfaces::ManagementCanister;

const ONE_HUNDRED_TRILLION: u128 = 100_000_000_000_000;

pub fn build_management_canister(agent: &Agent) -> ManagementCanister {
    ManagementCanister::create(agent)
}

pub async fn create_empty_canister(management_canister: &ManagementCanister<'_>) -> Principal {
    let (canister_id,) = management_canister
        .create_canister()
        .as_provisional_create_with_amount(Some(ONE_HUNDRED_TRILLION))
        .call_and_wait(delay())
        .await
        .expect("Failed to create canister");

    canister_id
}

pub async fn install_wasm<A: CandidType + Sync + Send>(
    management_canister: &ManagementCanister<'_>,
    canister_id: &Principal,
    wasm_bytes: &[u8],
    init_args: A,
) {
    management_canister
        .install_code(canister_id, wasm_bytes)
        .with_arg(init_args)
        .call_and_wait(delay())
        .await
        .expect("Failed to install wasm");
}

pub async fn upgrade_wasm<A: CandidType + Send + Sync>(
    management_canister: &ManagementCanister<'_>,
    canister_id: &Principal,
    wasm_bytes: &[u8],
    args: A,
) {
    println!("Stopping canister {}", canister_id);
    management_canister
        .stop_canister(canister_id)
        .call_and_wait(delay())
        .await
        .expect("Failed to stop canister");
    println!("Canister stopped");

    println!("Upgrading wasm for canister {}", canister_id);
    match management_canister
        .install_code(canister_id, wasm_bytes)
        .with_mode(InstallMode::Upgrade)
        .with_arg(args)
        .call_and_wait(delay())
        .await
    {
        Ok(_) => println!("Wasm upgraded"),
        Err(error) => println!("Upgrade failed: {:?}", error),
    };

    println!("Starting canister {}", canister_id);
    management_canister
        .start_canister(canister_id)
        .call_and_wait(delay())
        .await
        .expect("Failed to start canister");
    println!("Canister started");
}

pub async fn uninstall_wasm(management_canister: &ManagementCanister<'_>, canister_id: &Principal) {
    management_canister
        .uninstall_code(canister_id)
        .call_and_wait(delay())
        .await
        .expect("Failed to uninstall wasm");
}

// How `Agent` is instructed to wait for update calls.
pub fn delay() -> garcon::Delay {
    garcon::Delay::builder()
        .throttle(std::time::Duration::from_millis(500))
        .timeout(std::time::Duration::from_secs(60 * 5))
        .build()
}
