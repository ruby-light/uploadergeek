export const Canisters = {
    frontend: `${process.env.FRONTEND_CANISTER}`,
    governance: `${process.env.GOVERNANCE_CANISTER_ID}`,
}

export const allKnownCanisterIds: Array<string> = [
    Canisters.governance,
]

if (!!process.env.IS_TEST_SERVER) {
    console.log("Canisters", Canisters);
    console.log("allKnownCanisterIds", allKnownCanisterIds);
}