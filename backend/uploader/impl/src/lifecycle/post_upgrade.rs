use crate::{init_state, log_info};
use crate::lifecycle::pre_upgrade::StateVersion;
use crate::model::DataModel;
use crate::serializer::deserialize;
use crate::state::CanisterState;
use ic_cdk_macros::post_upgrade;

#[post_upgrade]
fn post_upgrade() {
    let (version, bytes): (StateVersion, Vec<u8>) = ic_cdk::storage::stable_restore().unwrap();

    match version {
        StateVersion::V1 => {
            let (model, logger_stable_data, monitor_stable_data): (
                DataModel,
                canistergeek_ic_rust::logger::PostUpgradeStableData,
                canistergeek_ic_rust::monitor::PostUpgradeStableData,
            ) = deserialize(&bytes).unwrap();

            init_state(CanisterState::new(model));

            canistergeek_ic_rust::monitor::post_upgrade_stable_data(monitor_stable_data);
            canistergeek_ic_rust::logger::post_upgrade_stable_data(logger_stable_data);
        }
    };

    log_info!("Post-upgrade completed!");
}
