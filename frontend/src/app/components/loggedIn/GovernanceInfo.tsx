import {Divider, Flex, Tag, Typography} from 'antd';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import type {ReactNode} from 'react';
import React from 'react';
import type {Governance, GovernanceParticipant} from 'src/declarations/governance/governance.did';

export const GovernanceInfo = (props: {governance: Governance; title: ReactNode; titleLevel?: 4 | 5}) => {
    const {governance, title, titleLevel = 4} = props;
    return (
        <>
            <PanelCard>
                <Flex vertical gap={32}>
                    <Typography.Title level={titleLevel}>{title}</Typography.Title>
                    <GovernanceVotingConfig governance={governance} />
                    <GovernanceParticipants governance={governance} />
                </Flex>
            </PanelCard>
        </>
    );
};

const GovernanceVotingConfig = (props: {governance: Governance}) => {
    const {governance} = props;
    return (
        <Flex vertical gap={8}>
            <Typography.Title level={5}>Voting Config</Typography.Title>
            {governance.voting_configuration.map((value, index) => {
                const proposalType = value[0];
                const votingConfig = value[1];
                return (
                    <KeyValueVertical
                        key={index}
                        gap={4}
                        label={getICFirstKey(proposalType)}
                        value={
                            <Flex gap={8}>
                                <Tag>{`Stop votes: ${votingConfig.stop_vote_count}`}</Tag>
                                <Tag>{`Positive votes: ${votingConfig.positive_vote_count}`}</Tag>
                            </Flex>
                        }
                    />
                );
            })}
        </Flex>
    );
};

const GovernanceParticipants = (props: {governance: Governance}) => {
    const {governance} = props;
    return (
        <Flex vertical gap={8}>
            <Typography.Title level={5}>Participants</Typography.Title>
            <Flex vertical gap={8}>
                {governance.participants.map((value, idx) => {
                    const principal = value[0];
                    const participant: GovernanceParticipant = value[1];
                    return (
                        <React.Fragment key={idx}>
                            <Flex vertical gap={8}>
                                <KeyValueVertical
                                    label="Participant"
                                    value={
                                        <Flex vertical>
                                            <CopyableUIDComponent uid={principal.toText()} />
                                            <span>{participant.name}</span>
                                        </Flex>
                                    }
                                />
                                {participant.proposal_permissions.map((value, index) => {
                                    const proposalType = value[0];
                                    const proposalPermission = value[1];
                                    return (
                                        <KeyValueVertical
                                            key={index}
                                            gap={4}
                                            label={getICFirstKey(proposalType)}
                                            value={
                                                <Flex gap={8}>
                                                    {proposalPermission.map((v, idx) => (
                                                        <Tag key={idx}>{getICFirstKey(v)}</Tag>
                                                    ))}
                                                </Flex>
                                            }
                                        />
                                    );
                                })}
                            </Flex>
                            <Divider size="small" />
                        </React.Fragment>
                    );
                })}
            </Flex>
        </Flex>
    );
};
