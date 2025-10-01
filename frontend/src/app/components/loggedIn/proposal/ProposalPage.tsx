import {toHexString, uint8ToBuf} from '@dfinity/candid';
import {fromNullable, isEmptyString, nonNullish} from '@dfinity/utils';
import {Descriptions, Input, Space, Tag, Typography} from 'antd';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {arrayToUint8Array} from 'frontend/src/utils/core/array/array';
import {formatDateTime} from 'frontend/src/utils/core/date/format';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {truncateMiddle} from 'frontend/src/utils/core/string/truncate';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';

import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import PubSub from 'pubsub-js';
import {useCallback, useEffect, useMemo, type ReactNode} from 'react';
import type {CallCanister, Governance, Proposal, UpgradeCanister, Vote} from 'src/declarations/governance/governance.did';
import {useGovernanceDataContext} from '../../data/GovernanceDataProvider';
import {GovernanceInfo} from '../GovernanceInfo';
import {Toolbar} from '../Toolbar';
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

    const fetchProposal = useCallback(async () => {
        await call([{proposal_id: BigInt(proposalId)}], {logger: apiLogger, logMessagePrefix: 'getProposal:'});
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

    const pageHeader = (
        <Space direction="vertical" size={0}>
            <h2 style={{margin: 0}}>Proposal: {proposalId}</h2>
        </Space>
    );

    if (!feature.status.loaded) {
        return (
            <Space direction="vertical" style={{width: '100%'}}>
                <Toolbar />
                {pageHeader}
                <PanelLoadingComponent />
            </Space>
        );
    }

    if (feature.error.isError || nonNullish(responseError) || data?.proposal == undefined) {
        const message = 'Unable to load proposal.';
        const errorDebugContext = feature.error.isError ? feature.error.error?.message : nonNullish(responseError) ? jsonStringify(responseError) : undefined;
        const messageText = <ErrorMessageText message={message} errorDebugContext={errorDebugContext} />;
        return (
            <Space direction="vertical" style={{width: '100%'}}>
                <Toolbar />
                {pageHeader}
                <ErrorAlert message={messageText} />
            </Space>
        );
    }

    return (
        <Space direction="vertical" style={{width: '100%'}}>
            <Toolbar />
            {pageHeader}
            <CopyProposalButton proposal={data.proposal} />
            <ProposalInfo proposal={data.proposal} />
        </Space>
    );
};

const ProposalInfo = (props: {proposal: Proposal}) => {
    const {proposal} = props;

    return (
        <Space direction="vertical">
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Proposal ID">{proposal.proposal_id.toString()}</Descriptions.Item>
                <Descriptions.Item label="Initiator">
                    <CopyableUIDComponent uid={proposal.initiator.toText()} />
                </Descriptions.Item>
                <Descriptions.Item label="State">{getICFirstKey(proposal.state)}</Descriptions.Item>
                <Descriptions.Item label="Created">{formatDateTime(Number(proposal.created))}</Descriptions.Item>
                <Descriptions.Item label="Updated">{formatDateTime(Number(proposal.updated))}</Descriptions.Item>
                <Descriptions.Item label="Description">{fromNullable(proposal.description) ?? ''}</Descriptions.Item>
                <Descriptions.Item label="Voting">
                    <ProposalVotingInfoAndControls proposal={proposal} />
                </Descriptions.Item>
            </Descriptions>
            <ProposalAdditionalInfo proposal={proposal} />
        </Space>
    );
};

const ProposalAdditionalInfo = (props: {proposal: Proposal}) => {
    const {proposal} = props;
    if (hasProperty(proposal.detail, 'UpdateGovernance')) {
        return <ProposalUpdateGovernanceAdditionalInfo proposal={proposal} newGovernance={proposal.detail.UpdateGovernance.new_governance} />;
    } else if (hasProperty(proposal.detail, 'CallCanister')) {
        return <ProposalCallCanisterAdditionalInfo proposal={proposal} task={proposal.detail.CallCanister.task} />;
    } else if (hasProperty(proposal.detail, 'UpgradeCanister')) {
        return <ProposalUpgradeCanisterAdditionalInfo proposal={proposal} task={proposal.detail.UpgradeCanister.task} />;
    }
    return null;
};

const ProposalUpdateGovernanceAdditionalInfo = (props: {proposal: Proposal; newGovernance: Governance}) => {
    return <GovernanceInfo governance={props.newGovernance} title="New Governance:" />;
};

const ProposalUpgradeCanisterAdditionalInfo = (props: {proposal: Proposal; task: UpgradeCanister}) => {
    const {proposal, task} = props;
    const {getGovernanceVotingConfigurationByProposalType} = useGovernanceDataContext();

    const taskInfo = (
        <div>
            <h3>Upgrade Canister task</h3>
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Uploader Principal">
                    <CopyableUIDComponent uid={task.uploader_id.toText()} truncateLength={100} />
                </Descriptions.Item>
                <Descriptions.Item label="Operator Principal">
                    <CopyableUIDComponent uid={task.operator_id.toText()} truncateLength={100} />
                </Descriptions.Item>
                <Descriptions.Item label="Canister Principal">
                    <CopyableUIDComponent uid={task.canister_id.toText()} truncateLength={100} />
                </Descriptions.Item>
                <Descriptions.Item label="Module Hash">{task.module_hash}</Descriptions.Item>
                <Descriptions.Item label="Argument Candid">{task.argument_candid}</Descriptions.Item>
            </Descriptions>
        </div>
    );

    const taskResultInfo: ReactNode = useMemo(() => {
        if (hasProperty(proposal.state, 'Performed')) {
            const {result} = proposal.state.Performed;
            if (hasProperty(result, 'CallResponse')) {
                const {candid, error, response} = result.CallResponse;
                const candidText: string = fromNullable(candid) ?? '';
                const errorText: string = fromNullable(error) ?? '';
                const responseText: string = toHexString(uint8ToBuf(arrayToUint8Array(response)));
                return (
                    <div>
                        <h3>Call Canister task result</h3>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Candid">
                                <Typography.Paragraph>
                                    <pre style={{fontSize: '0.8em'}}>{candidText}</pre>
                                </Typography.Paragraph>
                            </Descriptions.Item>
                            <Descriptions.Item label="Error">
                                <span className="gf-ant-color-error">{errorText}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Response">
                                <Typography.Text copyable={{text: responseText}}>{truncateMiddle(responseText, 50)}</Typography.Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            } else if (hasProperty(result, 'Error')) {
                const {reason} = result.Error;
                return (
                    <div>
                        <h3>Call Canister task result</h3>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Error">
                                <span className="gf-ant-color-error">{reason}</span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            } else if (hasProperty(result, 'Done')) {
                return (
                    <div>
                        <h3>Call Canister task result</h3>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Status">Done</Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            }
        }
        return null;
    }, [proposal]);

    const votingConfigurationUpgradeCanister = getGovernanceVotingConfigurationByProposalType('UpgradeCanister');
    const votingConfig =
        votingConfigurationUpgradeCanister != undefined ? (
            <div>
                <h3>Voting Config</h3>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="CallCanister">
                        stop_vote_count: {votingConfigurationUpgradeCanister.stop_vote_count} / positive_vote_count: {votingConfigurationUpgradeCanister.positive_vote_count}
                    </Descriptions.Item>
                </Descriptions>
            </div>
        ) : null;
    return (
        <Space direction="vertical">
            {votingConfig}
            {taskInfo}
            {taskResultInfo}
        </Space>
    );
};

const ProposalCallCanisterAdditionalInfo = (props: {proposal: Proposal; task: CallCanister}) => {
    const {proposal, task} = props;
    const governanceDataContext = useGovernanceDataContext();
    const canisterDID: string | undefined = fromNullable(task.canister_did);
    const taskInfo = (
        <div>
            <h3>Call Canister task</h3>
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Canister ID">
                    <CopyableUIDComponent uid={task.canister_id.toText()} />
                </Descriptions.Item>
                <Descriptions.Item label="Method">{task.method}</Descriptions.Item>
                <Descriptions.Item label="Argument Candid">{task.argument_candid}</Descriptions.Item>
                <Descriptions.Item label="Canister Candid">
                    <Input.TextArea value={canisterDID} size="small" readOnly rows={isEmptyString(canisterDID) ? 3 : 7} style={{width: 700}} />
                </Descriptions.Item>
            </Descriptions>
        </div>
    );

    const taskResultInfo: ReactNode = useMemo(() => {
        if (hasProperty(proposal.state, 'Performed')) {
            const {result} = proposal.state.Performed;
            if (hasProperty(result, 'CallResponse')) {
                const {candid, error, response} = result.CallResponse;
                const candidText: string = fromNullable(candid) ?? '';
                const errorText: string = fromNullable(error) ?? '';
                const responseText: string = toHexString(uint8ToBuf(arrayToUint8Array(response)));
                return (
                    <div>
                        <h3>Call Canister task result</h3>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Candid">
                                <Typography.Paragraph>
                                    <pre style={{fontSize: '0.8em'}}>{candidText}</pre>
                                </Typography.Paragraph>
                            </Descriptions.Item>
                            <Descriptions.Item label="Error">
                                <span className="gf-ant-color-error">{errorText}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Response">
                                <Typography.Text copyable={{text: responseText}}>{truncateMiddle(responseText, 50)}</Typography.Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            } else if (hasProperty(result, 'Error')) {
                const {reason} = result.Error;
                return (
                    <div>
                        <h3>Call Canister task result</h3>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Error">
                                <span className="gf-ant-color-error">{reason}</span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                );
            }
        }
        return null;
    }, [proposal]);

    const votingConfigurationCallCanister = governanceDataContext.getGovernanceVotingConfigurationByProposalType('CallCanister');
    const votingConfig =
        votingConfigurationCallCanister != undefined ? (
            <div>
                <h3>Voting Config</h3>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="CallCanister">
                        stop_vote_count: {votingConfigurationCallCanister.stop_vote_count} / positive_vote_count: {votingConfigurationCallCanister.positive_vote_count}
                    </Descriptions.Item>
                </Descriptions>
            </div>
        ) : null;
    return (
        <Space direction="vertical">
            {votingConfig}
            {taskInfo}
            {taskResultInfo}
        </Space>
    );
};

const ProposalVotingInfoAndControls = (props: {proposal: Proposal}) => {
    const {proposal} = props;
    return (
        <Space direction="vertical">
            {proposal.voting.votes.length == 0 ? <div>No votes</div> : null}
            {proposal.voting.votes.map((vote: Vote, idx) => {
                return (
                    <Descriptions bordered column={1} size="small" key={idx}>
                        <Descriptions.Item label={'Vote #' + (idx + 1)}>
                            <Space direction="horizontal">
                                <Tag>{vote.vote ? 'Yes' : 'No'}</Tag>
                                <span>{formatDateTime(Number(vote.vote_time))}</span>
                                <CopyableUIDComponent uid={vote.participant.toText()} truncateLength={100} />
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>
                );
            })}
            <OurVoteControls proposal={proposal} />
            <OurPerformControls proposal={proposal} />
        </Space>
    );
};
