import {fromNullable} from '@dfinity/utils';
import {Space, Table, Tag} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {formatDateTime} from 'frontend/src/utils/core/date/format';
import {getICFirstKey} from 'frontend/src/utils/ic/did';

import {compactArray, sortArrayByValues} from 'frontend/src/utils/core/array/array';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import type {ProposalInfo} from 'src/declarations/governance/governance.did';
import {useGovernanceDataContext} from '../data/GovernanceDataProvider';

type Props = {
    proposals: Array<ProposalInfo> | undefined;
};

type TableItemType = {
    proposalId: number;
    proposalType: string | undefined;
    createdMillis: number;
    initiator: string;
    initiatorName: string;
    description: string;
    state: string | undefined;
};

export const ProposalsTable = (props: Props) => {
    const {proposals} = props;
    const {getGovernanceParticipantByPrincipal} = useGovernanceDataContext();

    const dataSource: Array<TableItemType> = useMemo(() => {
        return sortArrayByValues(
            (proposals ?? []).map((proposal) => {
                return {
                    proposalId: Number(proposal.proposal_id),
                    proposalType: getICFirstKey(proposal.proposal.detail),
                    createdMillis: Number(proposal.proposal.created),
                    initiator: proposal.proposal.initiator.toString(),
                    initiatorName: getGovernanceParticipantByPrincipal(proposal.proposal.initiator)?.name ?? '',
                    description: fromNullable(proposal.proposal.description) ?? '',
                    state: getICFirstKey(proposal.proposal.state)
                };
            }),
            (v) => -v.createdMillis
        );
    }, [proposals, getGovernanceParticipantByPrincipal]);

    const columns: ColumnsType<TableItemType> = useMemo(() => {
        return compactArray([
            {
                title: 'Proposal ID',
                render: (record) => (
                    <Link to={`/proposal/${record.proposalId}`}>
                        <u>{record.proposalId}</u>
                    </Link>
                ),
                sorter: (a, b) => a.proposalId - b.proposalId,
                sortDirections: ['descend', 'ascend']
            },
            {
                title: 'Proposal Type',
                render: (record) => <Tag>{record.proposalType}</Tag>
            },
            {
                title: 'Created, UTC',
                render: (record) => formatDateTime(record.createdMillis),
                sorter: (a, b) => a.createdMillis - b.createdMillis,
                sortDirections: ['descend', 'ascend']
            },
            {
                title: 'Initiator',
                render: (record) => (
                    <Space direction="vertical" size={0}>
                        <CopyableUIDComponent uid={record.initiator} />
                        <span className="gf-ant-color-secondary">{record.initiatorName}</span>
                    </Space>
                )
                // sorter: (a, b) => a.initiator.localeCompare(b.initiator),
                // sortDirections: ["descend", "ascend"],
            },
            {
                title: 'State',
                render: (record) => record.state
                // sorter: (a, b) => a.state.localeCompare(b.state),
                // sortDirections: ["descend", "ascend"],
            },
            {
                title: 'Description',
                render: (record) => record.description
                // sorter: (a, b) => a.description.localeCompare(b.description),
                // sortDirections: ["descend", "ascend"],
            }
        ]) as ColumnsType<TableItemType>;
    }, []);

    return <Table<TableItemType> dataSource={dataSource} columns={columns} rowKey={(record) => `${record.proposalId.toString()}`} pagination={false} showSorterTooltip={false} />;
};
