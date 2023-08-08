use crate::guards::caller_is_governance_user;
use crate::time::get_unix_epoch_time_millis;
use crate::{log_error, log_info, mutate_state};
use candid::IDLArgs;
use governance_canister::add_new_proposal::*;
use governance_canister::types::{
    CallCanister, Governance, Proposal, ProposalDetail, ProposalPermission, ProposalState, ProposalType, UpgradeCanister,
    Voting,
};
use ic_cdk_macros::update;

#[update(guard = "caller_is_governance_user")]
fn add_new_proposal(args: Args) -> Response {
    match add_new_proposal_int(args) {
        Ok(result) => {
            log_info!("Added new proposal: {result:?}");
            Response::Ok(result)
        }
        Err(error) => {
            log_error!("Can not add new proposal: {error:?}");
            Response::Err(error)
        }
    }
}

fn add_new_proposal_int(args: AddNewProposalArgs) -> Result<AddNewProposalResult, AddNewProposalError> {
    let caller = ic_cdk::caller();
    let proposal_detail = args.proposal_detail;

    mutate_state(|state| {
        let is_add_permission = state.model.governance_storage.check_is_permission(
            &caller,
            &ProposalType::from(&proposal_detail),
            &ProposalPermission::Add,
        );

        if !is_add_permission {
            return Err(AddNewProposalError::NotPermission);
        }

        validate_proposal(&proposal_detail).map_err(|reason| AddNewProposalError::Validation { reason })?;

        let time = get_unix_epoch_time_millis();
        let proposal_id = state.model.proposal_storage.get_new_proposal_id();

        let proposal = Proposal {
            proposal_id,
            created: time,
            initiator: caller,
            state: ProposalState::Voting,
            voting: Voting::default(),
            detail: proposal_detail,
            description: args.description,
            updated: time,
        };

        state.model.proposal_storage.add_new_proposal(proposal_id, proposal.clone());

        Ok(AddNewProposalResult { proposal_id, proposal })
    })
}

fn validate_proposal(proposal_detail: &ProposalDetail) -> Result<(), String> {
    match proposal_detail {
        ProposalDetail::UpdateGovernance { new_governance } => validate_new_governance(new_governance),
        ProposalDetail::UpgradeCanister { task } => validate_upgrade_canister(task),
        ProposalDetail::CallCanister { task } => validate_perform_call(task),
    }
}

fn validate_new_governance(governance: &Governance) -> Result<(), String> {
    if governance.participants.is_empty() {
        return Err("participants is empty".to_string());
    }

    let can_make_new_governance_proposal = governance
        .participants
        .iter()
        .flat_map(|(_, participant)| {
            participant.proposal_permissions.iter().find(|(pt, permissions)| {
                pt == &ProposalType::UpdateGovernance && permissions.contains(&ProposalPermission::Add)
            })
        })
        .count();

    log_info!("can_make_new_governance_proposal: {can_make_new_governance_proposal:?}");

    if can_make_new_governance_proposal == 0 {
        return Err("not participant, who can make new governance proposal".to_string());
    }

    let can_vote_governance_proposal_count = governance
        .participants
        .iter()
        .flat_map(|(_, participant)| {
            participant.proposal_permissions.iter().find(|(pt, permissions)| {
                pt == &ProposalType::UpdateGovernance && permissions.contains(&ProposalPermission::Vote)
            })
        })
        .count();

    log_info!("can_vote_governance_proposal_count: {can_vote_governance_proposal_count:?}");

    let governance_voting_possible = governance.voting_configuration.iter().any(|(proposal_type, config)| {
        proposal_type == &ProposalType::UpdateGovernance
            && config.positive_vote_count <= config.stop_vote_count
            && config.stop_vote_count <= can_vote_governance_proposal_count as u32
    });

    if !governance_voting_possible {
        return Err("Wrong voting config for make new governance proposal".to_string());
    }
    Ok(())
}

fn validate_upgrade_canister(upgrade_canister: &UpgradeCanister) -> Result<(), String> {
    parse_candid(&upgrade_canister.argument_candid).map(|_| ())
}

fn validate_perform_call(perform_call: &CallCanister) -> Result<(), String> {
    parse_candid(&perform_call.argument_candid).map(|_| ())
}

pub(crate) fn parse_candid(candid: &str) -> Result<Vec<u8>, String> {
    let map_error = |e| format!("can not parse candid: {e:?}");
    let args: IDLArgs = candid.parse().map_err(map_error)?;
    args.to_bytes().map_err(map_error)
}
