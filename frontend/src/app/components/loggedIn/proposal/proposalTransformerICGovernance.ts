import type {Principal} from '@dfinity/principal';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import type {Governance, GovernanceParticipant, ProposalPermission, ProposalType, VotingConfig} from 'src/declarations/governance/governance.did';
import type {
    FormValuesType,
    FormValuesTypeParticipant,
    FormValuesTypeParticipantPermission,
    FormValuesTypeParticipantPermissions,
    FormValuesTypeVotingConfigElement
} from '../addProposalModal/AddProposalUpdateGovernanceModalComponent';

////////////////////////////////////////////////
// Governance
////////////////////////////////////////////////

/**
 * Method to transform a IC governance to a form values object
 * @param {Governance} governance
 * @param {string | undefined} description
 * @returns {FormValuesType}
 */
export const transformICGovernanceToFormValues = (governance: Governance, description: string | undefined): FormValuesType => {
    return {
        participants: transformICGovernanceParticipantsToFormValues(governance.participants),
        votingConfiguration: transformICGovernanceVotingConfigurationToFormValues(governance.voting_configuration),
        description: description ?? ''
    };
};

/**
 * Method to transform a IC governance voting configuration to a form values object
 * @param {Array<[ProposalType, VotingConfig]>} votingConfiguration
 * @returns {Array<FormValuesTypeVotingConfigElement>}
 */
const transformICGovernanceVotingConfigurationToFormValues = (votingConfiguration: Array<[ProposalType, VotingConfig]>): Array<FormValuesTypeVotingConfigElement> => {
    return votingConfiguration.map<FormValuesTypeVotingConfigElement>((votingConfig: [ProposalType, VotingConfig]) => {
        return {
            proposalType: getICFirstKey(votingConfig[0]) as KeysOfUnion<ProposalType>,
            numberOfVotes: votingConfig[1].stop_vote_count,
            numberOfVotesRequired: votingConfig[1].positive_vote_count
        };
    });
};

/**
 * Method to transform a IC governance participants to a form values object
 * @param {Array<[Principal, GovernanceParticipant]>} participants
 * @returns {Array<FormValuesTypeParticipant>}
 */
const transformICGovernanceParticipantsToFormValues = (participants: Array<[Principal, GovernanceParticipant]>): Array<FormValuesTypeParticipant> => {
    return participants.map<FormValuesTypeParticipant>((participant: [Principal, GovernanceParticipant]) => {
        return {
            principal: participant[0].toString(),
            name: participant[1].name,
            permissions: transformICGovernanceParticipantPermissionsToFormValues(participant[1].proposal_permissions)
        };
    });
};

/**
 * Method to transform a IC governance participant permissions to a form values object
 * @param {Array<[ProposalType, Array<ProposalPermission>]>} participantPermissions
 * @returns {FormValuesTypeParticipantPermissions}
 */
const transformICGovernanceParticipantPermissionsToFormValues = (participantPermissions: Array<[ProposalType, Array<ProposalPermission>]>): FormValuesTypeParticipantPermissions => {
    return participantPermissions.map<FormValuesTypeParticipantPermission>((participantPermission: [ProposalType, Array<ProposalPermission>]) => {
        return {
            proposalType: getICFirstKey(participantPermission[0]) as KeysOfUnion<ProposalType>,
            permissions: participantPermission[1].map(transformICGovernanceParticipantPermissionToFormValue)
        };
    });
};

/**
 * Method to transform a IC governance participant permission to a form value object
 * @param {ProposalPermission} proposalPermission
 * @returns {KeysOfUnion<ProposalPermission>}
 */
const transformICGovernanceParticipantPermissionToFormValue = (proposalPermission: ProposalPermission): KeysOfUnion<ProposalPermission> => {
    return getICFirstKey(proposalPermission) as KeysOfUnion<ProposalPermission>;
};
