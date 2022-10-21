use crate::serializer::serialize;
use crate::take_state;
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
    ic_cdk::print("Pre-upgrade starting ...");

    let stable_state = (state.model, "log_messages");
    let bytes = serialize(&stable_state).unwrap();

    ic_cdk::storage::stable_save((StateVersion::V1, &bytes)).unwrap();
}
