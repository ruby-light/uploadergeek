mod guards;
mod lifecycle;
mod management;
mod model;
mod queries;
mod serializer;
mod state;
mod updates;

canister_state_macros::canister_state!(state::CanisterState);
