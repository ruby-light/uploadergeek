use crate::init_state;
use crate::model::DataModel;
use crate::state::CanisterState;
use ic_cdk::api::debug_print;
use ic_cdk_macros::init;

#[init]
fn init() {
    init_state(CanisterState::new(DataModel::default()));
    debug_print("Uploader initialized!");
}
