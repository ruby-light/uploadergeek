import {Descriptions, Space, Tag} from 'antd';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import type {ReactNode} from 'react';
import type {Governance, GovernanceParticipant} from 'src/declarations/governance/governance.did';

export const GovernanceInfo = (props: {governance: Governance; title: ReactNode}) => {
    const {governance, title} = props;
    return (
        <Space direction="vertical" size="small">
            <h2>{title}</h2>
            <Space direction="vertical">
                <GovernanceVotingConfig governance={governance} />
                <GovernanceParticipants governance={governance} />
            </Space>
        </Space>
    );
};

export const GovernanceVotingConfig = (props: {governance: Governance}) => {
    const {governance} = props;
    return (
        <div>
            <h3>Voting Config</h3>
            <Descriptions bordered column={1} size="small">
                {governance.voting_configuration.map((value, index) => {
                    const proposalType = value[0];
                    const votingConfig = value[1];
                    return (
                        <Descriptions.Item label={<>{getICFirstKey(proposalType)}</>} key={index}>
                            stop_vote_count: {votingConfig.stop_vote_count} / positive_vote_count: {votingConfig.positive_vote_count}
                        </Descriptions.Item>
                    );
                })}
            </Descriptions>
        </div>
    );
};

const GovernanceParticipants = (props: {governance: Governance}) => {
    const {governance} = props;
    return (
        <div>
            <h3>Participants</h3>
            <Space direction="vertical">
                {governance.participants.map((value, idx) => {
                    const principal = value[0];
                    const participant: GovernanceParticipant = value[1];
                    return (
                        <Space direction="vertical" size="small" key={idx}>
                            <CopyableUIDComponent uid={principal.toText()} truncateLength={100} />
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Name">{participant.name}</Descriptions.Item>
                                <Descriptions.Item label="Permissions">
                                    <Descriptions bordered column={1} size="small">
                                        {participant.proposal_permissions.map((value, index) => {
                                            const proposalType = value[0];
                                            const proposalPermission = value[1];
                                            return (
                                                <Descriptions.Item label={<>{getICFirstKey(proposalType)}</>} key={index}>
                                                    <Space direction="horizontal">
                                                        {proposalPermission.map((v, idx) => (
                                                            <Tag key={idx}>{getICFirstKey(v)}</Tag>
                                                        ))}
                                                    </Space>
                                                </Descriptions.Item>
                                            );
                                        })}
                                    </Descriptions>
                                </Descriptions.Item>
                            </Descriptions>
                        </Space>
                    );
                })}
            </Space>
        </div>
    );
};
