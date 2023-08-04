use candid::Principal;
use governance_canister::types::{Governance, GovernanceParticipant, ProposalPermission, ProposalType, VotingConfig};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct GovernanceStorage {
    governance: Governance,
}

impl GovernanceStorage {
    pub(crate) fn set_new_governance(&mut self, new_governance: Governance) {
        self.governance = new_governance;
    }

    pub(crate) fn get_governance_participant(&self, principal: &Principal) -> Option<&GovernanceParticipant> {
        self.governance
            .participants
            .iter()
            .find(|(p, _)| p == principal)
            .map(|(_, participant)| participant)
    }

    pub(crate) fn check_is_permission(
        &self,
        principal: &Principal,
        proposal_type: &ProposalType,
        permission: &ProposalPermission,
    ) -> bool {
        self.get_governance_participant(principal)
            .map(|participant| {
                participant
                    .proposal_permissions
                    .iter()
                    .find(|(pt, _)| pt == proposal_type)
                    .map(|(_, permissions)| permissions.contains(permission))
                    .unwrap_or(false)
            })
            .unwrap_or(false)
    }

    pub(crate) fn get_voting_configuration(&self, proposal_type: &ProposalType) -> Option<&VotingConfig> {
        self.governance
            .voting_configuration
            .iter()
            .find(|(pt, _)| pt == proposal_type)
            .map(|(_, config)| config)
    }
}
