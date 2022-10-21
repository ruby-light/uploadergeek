use crate::init_state;
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
            let (model, _messages): (DataModel, String) = deserialize(&bytes).unwrap();
            init_state(CanisterState::new(model));
        }
    };

    ic_cdk::print("Post-upgrade completed!");
}
