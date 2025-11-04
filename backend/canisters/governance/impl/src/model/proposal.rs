use governance_canister::types::{Proposal, ProposalId};
use serde::{Deserialize, Serialize};
use std::collections::btree_map::Iter;
use std::collections::BTreeMap;

type ProposalTable = BTreeMap<ProposalId, Proposal>;

#[derive(Serialize, Deserialize, Default)]
pub struct ProposalStorage {
    proposal_id_sequence: ProposalId,
    proposals_table: ProposalTable,
}

impl ProposalStorage {
    pub(crate) fn get_proposal(&self, proposal_id: &ProposalId) -> Option<&Proposal> {
        self.proposals_table.get(proposal_id)
    }

    pub(crate) fn get_proposal_mut(&mut self, proposal_id: &ProposalId) -> Option<&mut Proposal> {
        self.proposals_table.get_mut(proposal_id)
    }

    pub(crate) fn get_last_proposal_id(&self) -> ProposalId {
        self.proposal_id_sequence
    }

    pub(crate) fn get_new_proposal_id(&mut self) -> ProposalId {
        self.proposal_id_sequence += 1;
        self.proposal_id_sequence
    }

    pub(crate) fn add_new_proposal(&mut self, proposal_id: ProposalId, proposal: Proposal) {
        assert!(!self.proposals_table.contains_key(&proposal_id));
        self.proposals_table.insert(proposal_id, proposal);
    }

    pub(crate) fn get_proposals_iter(&self) -> Iter<'_, ProposalId, Proposal> {
        self.proposals_table.iter()
    }
}
