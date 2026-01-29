import {isNullish, nonNullish} from '@dfinity/utils';
import {Button, Flex, Popconfirm} from 'antd';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import PubSub from 'pubsub-js';
import {useCallback, useMemo} from 'react';
import type {Proposal, VoteForProposalArgs} from 'src/declarations/governance/governance.did';
import {FETCH_PROPOSAL_NOTIFICATION} from './ProposalPage';

type Props = {
    proposal: Proposal;
};

export const OurVoteControls = (props: Props) => {
    const {proposal} = props;
    const {proposal_id: proposalId} = proposal;

    const {call, feature, responseError} = useICCanisterCallGovernance('voteForProposal');

    const {principal: currentPrincipal} = useAuthContext();

    const currentParticipantCanVote = useMemo(() => {
        if (isNullish(currentPrincipal)) {
            return false;
        }
        if (!hasProperty(proposal.state, 'Voting')) {
            return false;
        }
        return !proposal.voting.votes.some((v) => {
            return v.participant.compareTo(currentPrincipal) === 'eq';
        });
    }, [currentPrincipal, proposal.state, proposal.voting.votes]);

    const {inProgress} = feature.status;

    const sendVote = useCallback(
        async (vote: boolean) => {
            const requestArgs: VoteForProposalArgs = {
                vote: vote,
                proposal_id: proposalId
            };
            const response = await call([requestArgs], {
                logger: apiLogger,
                logMessagePrefix: 'voteForProposal:'
            });
            if (hasProperty(response, 'Ok')) {
                PubSub.publish(FETCH_PROPOSAL_NOTIFICATION);
            }
        },
        [call, proposalId]
    );

    if (currentParticipantCanVote) {
        const errorPanel =
            feature.error.isError || nonNullish(responseError) ? (
                <ErrorAlert
                    message={
                        <ErrorMessageText
                            message="Unable to vote."
                            errorDebugContext={feature.error.isError ? feature.error.error?.message : nonNullish(responseError) ? jsonStringify(responseError) : undefined}
                        />
                    }
                />
            ) : null;

        const disabled = inProgress;

        return (
            <Flex gap={8} align="center">
                <Popconfirm title="Are you sure to vote YES?" disabled={disabled} okButtonProps={{loading: inProgress, disabled}} cancelButtonProps={{disabled}} onConfirm={() => sendVote(true)}>
                    <Button color="green" variant="solid" disabled={disabled}>
                        Approve
                    </Button>
                </Popconfirm>
                <Popconfirm title="Are you sure to vote NO?" disabled={disabled} okButtonProps={{loading: inProgress, disabled}} cancelButtonProps={{disabled}} onConfirm={() => sendVote(false)}>
                    <Button color="red" variant="solid" disabled={disabled}>
                        Decline
                    </Button>
                </Popconfirm>
                {errorPanel}
            </Flex>
        );
    }
    return null;
};
