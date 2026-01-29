// import {toHexString, uint8ToBuf} from '@dfinity/candid';
import {fromNullable, isNullish, nonNullish, uint8ArrayToHexString} from '@dfinity/utils';
import {Flex, Input, Spin, Tag, Typography} from 'antd';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {apiLogger, applicationLogger} from 'frontend/src/context/logger/logger';
import {arrayToUint8Array} from 'frontend/src/utils/core/array/array';
import {formatDateAgo} from 'frontend/src/utils/core/date/format';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {hasProperty, type KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';

import {DateTimeComponent} from 'frontend/src/components/widgets/DateTimeComponent';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {AbstractStubPage} from 'frontend/src/components/widgets/stub/AbstractStubPage';
import {i18} from 'frontend/src/i18';
import {delayPromise} from 'frontend/src/utils/core/promise/promiseUtils';
import {IS_DEV_ENVIRONMENT} from 'frontend/src/utils/env';
import PubSub from 'pubsub-js';
import React, {useCallback, useEffect} from 'react';
import type {CallCanister, Governance, Proposal, ProposalDetail, ProposalType, UpgradeCanister, Vote} from 'src/declarations/governance/governance.did';
import {useGovernanceContext} from '../../../../context/governance/GovernanceProvider';
import {GovernanceInfo} from '../GovernanceInfo';
import {CopyProposalButton} from './CopyProposalButton';
import {OurPerformControls} from './OurPerformControls';
import {OurVoteControls} from './OurVoteControls';

type Props = {
    proposalId: number;
};

export const FETCH_PROPOSAL_NOTIFICATION = 'FETCH_PROPOSAL_NOTIFICATION';

export const ProposalPage = (props: Props) => {
    const {proposalId} = props;
    const {call, data, feature, responseError} = useICCanisterCallGovernance('getProposal');
    const fetchProposalInProgress = feature.status.inProgress;
    applicationLogger.log(`ProposalPage: Rendering proposal page for proposalId=${proposalId}`, {fetchProposalInProgress});
    const fetchProposal = useCallback(async () => {
        const logMessagePrefix = `ProposalPage:getProposal:proposalId=${proposalId}:`;
        applicationLogger.log(`${logMessagePrefix} Fetching proposal`);
        await call([{proposal_id: BigInt(proposalId)}], {
            logger: apiLogger,
            logMessagePrefix: 'getProposal:',
            onBeforeRequest: async () => {
                if (IS_DEV_ENVIRONMENT) {
                    applicationLogger.log(`${logMessagePrefix} Simulating delay before fetching proposal`);
                    await delayPromise(1000);
                    applicationLogger.log(`${logMessagePrefix} Delay before fetching proposal completed`);
                    // throw new Error(`Simulated error in dev environment ${Date.now()}`);
                }
            }
        });
        applicationLogger.log(`${logMessagePrefix} Fetching proposal completed`);
    }, [call, proposalId]);

    useEffect(() => {
        fetchProposal();
    }, [fetchProposal]);

    useEffect(() => {
        const token = PubSub.subscribe(FETCH_PROPOSAL_NOTIFICATION, () => {
            fetchProposal();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchProposal]);

    if (!feature.status.loaded) {
        return <AbstractStubPage title="Loading proposal..." icon="loading" />;
    }

    if (feature.error.isError || nonNullish(responseError) || data?.proposal == undefined) {
        const message = `Unable to load proposal ${proposalId}.`;
        const errorDebugContext = feature.error.isError ? feature.error.error?.message : nonNullish(responseError) ? jsonStringify(responseError) : undefined;
        const messageText = <ErrorMessageText message={message} errorDebugContext={errorDebugContext} />;
        return (
            <Flex vertical>
                <ErrorAlert message={messageText} />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            <PanelCard>
                <Flex vertical gap={16}>
                    <Flex justify="space-between" gap={8} wrap>
                        <PanelHeader title={`${getICFirstKey(data.proposal.detail)} Proposal: ${proposalId}`} />
                        <CopyProposalButton proposal={data.proposal} />
                    </Flex>
                    <ProposalInfo proposal={data.proposal} />
                </Flex>
            </PanelCard>
            <ProposalVotingPanel proposal={data.proposal} fetchProposalInProgress={fetchProposalInProgress} />
            <ProposalAdditionalInfoPanels proposal={data.proposal} />
        </Flex>
    );
};

const ProposalInfo = (props: {proposal: Proposal}) => {
    const {proposal} = props;

    const description = fromNullable(proposal.description);
    return (
        <Flex vertical gap={8}>
            <KeyValueVertical label="Proposal ID" value={proposal.proposal_id.toString()} />
            <KeyValueVertical label="Initiator" value={<CopyableUIDComponent uid={proposal.initiator.toText()} />} />
            <KeyValueVertical label="State" value={getICFirstKey(proposal.state) ?? '-'} />
            <KeyValueVertical
                label="Created"
                value={
                    <Flex vertical>
                        <DateTimeComponent timeMillis={proposal.created} />
                        <span className="gf-font-size-smaller">{formatDateAgo(Number(proposal.created))}</span>
                    </Flex>
                }
            />
            <KeyValueVertical
                label="Updated"
                value={
                    <Flex vertical>
                        <DateTimeComponent timeMillis={proposal.updated} />
                        <span className="gf-font-size-smaller">{formatDateAgo(Number(proposal.updated))}</span>
                    </Flex>
                }
            />
            <KeyValueVertical label="Description" value={description ?? '-'} valueClassName="gf-preLine" />
        </Flex>
    );
};

const ProposalVotingPanel = (props: {proposal: Proposal; fetchProposalInProgress: boolean}) => {
    const {proposal, fetchProposalInProgress} = props;
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Typography.Title level={5}>Voting</Typography.Title>
                <ProposalVotingInfoAndControls proposal={proposal} fetchProposalInProgress={fetchProposalInProgress} />
            </Flex>
        </PanelCard>
    );
};

const ProposalAdditionalInfoPanels = (props: {proposal: Proposal}) => {
    const {proposal} = props;
    if (hasProperty(proposal.detail, 'UpdateGovernance')) {
        return <ProposalUpdateGovernanceAdditionalInfo proposal={proposal} newGovernance={proposal.detail.UpdateGovernance.new_governance} proposalType="UpdateGovernance" />;
    } else if (hasProperty(proposal.detail, 'CallCanister')) {
        return <ProposalCallCanisterAdditionalInfo proposal={proposal} task={proposal.detail.CallCanister.task} proposalType="CallCanister" />;
    } else if (hasProperty(proposal.detail, 'UpgradeCanister')) {
        return <ProposalUpgradeCanisterAdditionalInfo proposal={proposal} task={proposal.detail.UpgradeCanister.task} proposalType="UpgradeCanister" />;
    }
    return null;
};

const ProposalUpdateGovernanceAdditionalInfo = (props: {proposal: Proposal; newGovernance: Governance; proposalType: KeysOfUnion<ProposalType>}) => {
    const {proposal, proposalType} = props;

    const taskInfo = <GovernanceInfo governance={props.newGovernance} title={`${props.proposalType} task`} titleLevel={5} />;

    return (
        <Flex vertical gap={16}>
            <ProposalVotingConfigurationPanel proposalType={proposalType} />
            {taskInfo}
            <ProposalTaskResultInfo proposal={proposal} proposalType={proposalType} />
        </Flex>
    );
};

const ProposalUpgradeCanisterAdditionalInfo = (props: {proposal: Proposal; task: UpgradeCanister; proposalType: KeysOfUnion<ProposalType>}) => {
    const {proposal, task, proposalType} = props;

    const taskInfo = (
        <PanelCard>
            <Flex vertical gap={16}>
                <Typography.Title level={5}>{proposalType} task</Typography.Title>
                <Flex vertical gap={8}>
                    <KeyValueVertical label="Uploader Principal" value={<CopyableUIDComponent uid={task.uploader_id.toText()} />} />
                    <KeyValueVertical label="Operator Principal" value={<CopyableUIDComponent uid={task.operator_id.toText()} />} />
                    <KeyValueVertical label="Canister Principal" value={<CopyableUIDComponent uid={task.canister_id.toText()} />} />
                    <KeyValueVertical label="Module Hash" value={task.module_hash} />
                    <KeyValueVertical label="Argument Candid" value={<Input.TextArea value={task.argument_candid} size="small" readOnly rows={2} />} />
                </Flex>
            </Flex>
        </PanelCard>
    );
    return (
        <Flex vertical gap={8}>
            <ProposalVotingConfigurationPanel proposalType={proposalType} />
            {taskInfo}
            <ProposalTaskResultInfo proposal={proposal} proposalType={proposalType} />
        </Flex>
    );
};

const ProposalCallCanisterAdditionalInfo = (props: {proposal: Proposal; task: CallCanister; proposalType: KeysOfUnion<ProposalType>}) => {
    const {proposal, task, proposalType} = props;
    const canisterDID: string | undefined = fromNullable(task.canister_did);
    const payment: bigint | undefined = fromNullable(task.payment);
    const taskInfo = (
        <PanelCard>
            <Flex vertical gap={16}>
                <Typography.Title level={5}>{proposalType} task</Typography.Title>
                <Flex vertical gap={8}>
                    <KeyValueVertical label="Canister ID" value={<CopyableUIDComponent uid={task.canister_id.toText()} />} />
                    <KeyValueVertical label="Method" value={task.method} />
                    <KeyValueVertical label="Argument Candid" value={<Input.TextArea value={task.argument_candid} size="small" readOnly rows={5} />} />
                    <KeyValueVertical label="Canister Candid" value={isNullish(canisterDID) ? '-' : <Input.TextArea value={canisterDID} size="small" readOnly rows={2} />} />
                    <KeyValueVertical label="Payment" value={isNullish(payment) ? '-' : payment.toString()} />
                </Flex>
            </Flex>
        </PanelCard>
    );

    return (
        <Flex vertical gap={16}>
            <ProposalVotingConfigurationPanel proposalType={proposalType} />
            {taskInfo}
            <ProposalTaskResultInfo proposal={proposal} proposalType={proposalType} />
        </Flex>
    );
};

const ProposalVotingInfoAndControls = (props: {proposal: Proposal; fetchProposalInProgress: boolean}) => {
    const {proposal, fetchProposalInProgress} = props;

    const votingControls = !fetchProposalInProgress ? <OurVoteControls proposal={proposal} /> : null;
    const performControls = !fetchProposalInProgress ? <OurPerformControls proposal={proposal} /> : null;

    return (
        <Flex vertical gap={16}>
            <Votes votes={proposal.voting.votes} fetchProposalInProgress={fetchProposalInProgress} />
            {votingControls}
            {performControls}
        </Flex>
    );
};

const Votes = ({votes, fetchProposalInProgress}: {votes: Array<Vote>; fetchProposalInProgress: boolean}) => {
    const {getGovernanceParticipantByPrincipal} = useGovernanceContext();

    if (fetchProposalInProgress) {
        return (
            <div>
                <Spin size="small" />
            </div>
        );
    }

    if (votes.length == 0) {
        return <div>No votes</div>;
    }
    return (
        <div>
            {votes.map((vote: Vote, idx) => {
                const participantName = getGovernanceParticipantByPrincipal(vote.participant)?.name;
                return (
                    <React.Fragment key={idx}>
                        <KeyValueVertical
                            label={`Vote #${idx + 1}`}
                            gap={8}
                            value={
                                <Flex vertical gap={8}>
                                    <div>{vote.vote ? <Tag color="green">{i18.common.vote.approve}</Tag> : <Tag color="red">{i18.common.vote.decline}</Tag>}</div>
                                    <div>
                                        <DateTimeComponent timeMillis={vote.vote_time} />
                                        <div className="gf-font-size-smaller">{formatDateAgo(Number(vote.vote_time))}</div>
                                    </div>
                                    <div>
                                        <CopyableUIDComponent uid={vote.participant.toText()} />
                                        {nonNullish(participantName) ? <div>{participantName}</div> : null}
                                    </div>
                                </Flex>
                            }
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const ProposalVotingConfigurationPanel = (props: {proposalType: KeysOfUnion<ProposalType>}) => {
    const {proposalType} = props;
    const {getGovernanceVotingConfigurationByProposalType} = useGovernanceContext();

    const votingConfigurationUpdateGovernance = getGovernanceVotingConfigurationByProposalType(proposalType);
    if (isNullish(votingConfigurationUpdateGovernance)) {
        return null;
    }
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Typography.Title level={5}>Voting Config</Typography.Title>
                <KeyValueVertical
                    gap={4}
                    label={proposalType}
                    value={
                        <Flex gap={8}>
                            <Tag>{`Stop votes: ${votingConfigurationUpdateGovernance.stop_vote_count}`}</Tag>
                            <Tag>{`Positive votes: ${votingConfigurationUpdateGovernance.positive_vote_count}`}</Tag>
                        </Flex>
                    }
                />
            </Flex>
        </PanelCard>
    );
};

const ProposalTaskResultInfo = (props: {proposal: Proposal; proposalType: KeysOfUnion<ProposalDetail>}) => {
    const {proposal, proposalType} = props;
    if (hasProperty(proposal.state, 'Performed')) {
        const {result} = proposal.state.Performed;
        if (hasProperty(result, 'CallResponse')) {
            const {candid, error, response} = result.CallResponse;
            const candidText: string | undefined = fromNullable(candid);
            const errorText: string | undefined = fromNullable(error);
            const responseText: string = uint8ArrayToHexString(arrayToUint8Array(response));
            return (
                <PanelCard>
                    <Flex vertical gap={16}>
                        <Typography.Title level={5}>{proposalType} task result</Typography.Title>
                        <Flex vertical gap={8}>
                            <KeyValueVertical label="Response" value={<Input.TextArea value={responseText} size="small" readOnly rows={3} />} />
                            {nonNullish(candidText) ? <KeyValueVertical label="Candid" value={<Input.TextArea value={candidText} size="small" readOnly rows={5} />} /> : null}
                            {nonNullish(errorText) ? (
                                <KeyValueVertical label="Error" value={<Input.TextArea value={errorText} size="small" readOnly rows={5} className="gf-ant-color-error" />} />
                            ) : null}
                        </Flex>
                    </Flex>
                </PanelCard>
            );
        } else if (hasProperty(result, 'Error')) {
            const {reason} = result.Error;
            return (
                <PanelCard>
                    <Flex vertical gap={16}>
                        <Typography.Title level={5}>{proposalType} task result</Typography.Title>
                        <KeyValueVertical label="Error" value={<Input.TextArea value={reason} size="small" readOnly rows={5} className="gf-ant-color-error" />} />
                    </Flex>
                </PanelCard>
            );
        } else if (hasProperty(result, 'Done')) {
            return (
                <PanelCard>
                    <Flex vertical gap={16}>
                        <Typography.Title level={5}>{proposalType} task result</Typography.Title>
                        <KeyValueVertical label="Status" value="Done" />
                    </Flex>
                </PanelCard>
            );
        }
    }
    return null;
};
