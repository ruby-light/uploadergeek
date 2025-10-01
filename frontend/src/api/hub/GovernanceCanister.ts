import type {Principal} from '@dfinity/principal';
import type {CanisterOptions} from '@dfinity/utils';
import {Canister, createServices} from '@dfinity/utils';
import {idlFactory, type _SERVICE, type AddNewProposalArgs, type GetProposalArgs, type GetProposalsArgs, type VoteForProposalArgs} from 'src/declarations/governance/governance.did';

type HubService = _SERVICE;

interface HubCanisterOptions<T> extends Omit<CanisterOptions<T>, 'canisterId'> {
    canisterId: Principal;
}

export class GovernanceCanister extends Canister<HubService> {
    static create(options: HubCanisterOptions<HubService>) {
        const {service, certifiedService, canisterId} = createServices<HubService>({
            options,
            idlFactory,
            certifiedIdlFactory: idlFactory
        });

        return new GovernanceCanister(canisterId, service, certifiedService);
    }

    getMyGovernanceParticipant = async () => {
        return await this.caller({}).get_my_governance_participant({});
    };

    getGovernance = async () => {
        return await this.caller({}).get_governance({});
    };

    getProposals = async (params: GetProposalsArgs) => {
        return await this.caller({}).get_proposals(params);
    };

    getProposal = async (params: GetProposalArgs) => {
        return await this.caller({}).get_proposal(params);
    };

    voteForProposal = async (params: VoteForProposalArgs) => {
        return await this.caller({}).vote_for_proposal(params);
    };

    performProposal = async (params: GetProposalArgs) => {
        return await this.caller({}).perform_proposal(params);
    };

    addNewProposal = async (params: AddNewProposalArgs) => {
        return await this.caller({}).add_new_proposal(params);
    };
}
