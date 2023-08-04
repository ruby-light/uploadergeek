use icgeek_candid_gen::*;

#[allow(deprecated)]
fn main() {
    generate_init_candid_method!(governance_canister, init);

    generate_update_candid_method!(governance_canister, add_new_proposal);
    generate_update_candid_method!(governance_canister, vote_for_proposal);
    generate_update_candid_method!(governance_canister, perform_proposal);
    generate_update_candid_method!(governance_canister, set_geek_user_principals);
    generate_update_candid_method!(
        governance_canister,
        update_canistergeek_information,
        Args,
        Stub,
        updateCanistergeekInformation
    );

    generate_query_candid_method!(governance_canister, get_geek_user_principals);
    generate_query_candid_method!(governance_canister, get_my_governance_participant);
    generate_query_candid_method!(
        governance_canister,
        get_canistergeek_information,
        Args,
        Response,
        getCanistergeekInformation
    );

    candid::export_service!();
    std::print!("{}", __export_service());

    // export_service!();
    //
    // #[ic_cdk_macros::query(name = "__get_candid_interface_tmp_hack")]
    // fn export_candid() -> String {
    //     __export_service()
    // }
}
