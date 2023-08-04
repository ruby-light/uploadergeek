use crate::serializer::serialize;
use crate::{log_info, take_state};
use candid::CandidType;
use ic_cdk_macros::pre_upgrade;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize)]
pub enum StateVersion {
    V1,
}

#[pre_upgrade]
fn pre_upgrade() {
    let state = take_state();
    log_info!("Governance pre-upgrade starting ...");

    let logger_stable_data = canistergeek_ic_rust::logger::pre_upgrade_stable_data();
    let monitor_stable_data = canistergeek_ic_rust::monitor::pre_upgrade_stable_data();

    let stable_state = (state.model, logger_stable_data, monitor_stable_data);
    let bytes = serialize(&stable_state).unwrap();

    ic_cdk::storage::stable_save((StateVersion::V1, &bytes)).unwrap();
}
