use crate::model::DataModel;
use crate::state::CanisterState;
use crate::{init_state, log_info, mutate_state};
use governance_canister::init::Args;
use ic_cdk::api::canister_self;
use ic_cdk_macros::init;

use include_dir::{include_dir, Dir};

#[init]
fn init(args: Args) {
    init_state(CanisterState::new(DataModel::default()));
    init_http_assets();

    mutate_state(|state| {
        state.model.governance_storage.set_new_governance(args.governance);
        state
            .model
            .geek_user_storage
            .set_geek_user_principals(args.geek_user_principals);
    });

    log_info!("Governance initialized!");
}

static ASSETS_DIR: Dir<'_> = include_dir!("release/frontend");

pub(crate) fn init_http_assets() {
    common_embed_assets::certify_all_assets(&ASSETS_DIR, Some(canister_self().to_text().as_str()));
}
