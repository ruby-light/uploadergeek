use crate::model::DataModel;
use crate::state::CanisterState;
use crate::{init_state, log_info, mutate_state};
use governance_canister::init::Args;
use ic_cdk_macros::init;

#[init]
fn init(args: Args) {
    init_state(CanisterState::new(DataModel::default()));

    mutate_state(|state| {
        state.model.governance_storage.set_new_governance(args.governance);
        state
            .model
            .geek_user_storage
            .set_geek_user_principals(args.geek_user_principals);
    });

    log_info!("Governance initialized!");
}
