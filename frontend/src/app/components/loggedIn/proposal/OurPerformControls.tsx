import {nonNullish} from '@dfinity/utils';
import {Button, Popconfirm, Space} from 'antd';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {FETCH_CURRENT_GOVERNANCE_NOTIFICATION} from 'frontend/src/context/governance/GovernanceProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {hasProperty, type KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback} from 'react';
import type {GetProposalArgs, Proposal, ProposalType} from 'src/declarations/governance/governance.did';
import {useMyGovernanceParticipantContext} from '../../../../context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {FETCH_PROPOSAL_NOTIFICATION} from './ProposalPage';

type Props = {
    proposal: Proposal;
};

export const OurPerformControls = (props: Props) => {
    const {proposal} = props;
    const {proposal_id: proposalId} = proposal;

    const {call, data, feature, responseError} = useICCanisterCallGovernance('performProposal');

    const {fetchMyGovernanceParticipant, hasProposalPermission} = useMyGovernanceParticipantContext();

    const {inProgress} = feature.status;

    const sendPerform = useCallback(async () => {
        const requestArgs: GetProposalArgs = {
            proposal_id: proposalId
        };
        const response = await call([requestArgs], {logger: apiLogger, logMessagePrefix: 'performProposal:'});
        if (hasProperty(response, 'Ok')) {
            PubSub.publish(FETCH_PROPOSAL_NOTIFICATION);
            PubSub.publish(FETCH_CURRENT_GOVERNANCE_NOTIFICATION);
        }
        await fetchMyGovernanceParticipant();
    }, [call, fetchMyGovernanceParticipant, proposalId]);

    const proposalFromResponse = data?.proposal;
    if (nonNullish(proposalFromResponse)) {
        if (!hasProperty(proposalFromResponse.state, 'Approved')) {
            return null;
        }
    }

    if (!hasProperty(proposal.state, 'Approved')) {
        return null;
    }

    if (!hasProposalPermission(getICFirstKey(proposal.detail) as KeysOfUnion<ProposalType>, 'Perform')) {
        return null;
    }

    const errorPanel =
        feature.error.isError || nonNullish(responseError) ? (
            <ErrorAlert
                message={
                    <ErrorMessageText
                        message="Unable to perform proposal."
                        errorDebugContext={feature.error.isError ? feature.error.error?.message : nonNullish(responseError) ? jsonStringify(responseError) : undefined}
                    />
                }
            />
        ) : null;

    return (
        <Space>
            <Popconfirm
                title="Are you sure to perform?"
                okButtonProps={{loading: inProgress, disabled: inProgress}}
                cancelButtonProps={{loading: inProgress, disabled: inProgress}}
                onConfirm={() => sendPerform()}>
                <Button>Perform</Button>
            </Popconfirm>
            {errorPanel}
        </Space>
    );
};
