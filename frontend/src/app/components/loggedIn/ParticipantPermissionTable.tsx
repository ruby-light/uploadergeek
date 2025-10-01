import {Space, Table, Tag} from 'antd';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';

import {useMemo} from 'react';
import type {ProposalPermission, ProposalType} from 'src/declarations/governance/governance.did';

type Props = {
    proposalPermissions: Array<[ProposalType, Array<ProposalPermission>]>;
};

type TableItemType = {
    proposalType: KeysOfUnion<ProposalType>;
    proposalPermissions: Array<KeysOfUnion<ProposalPermission>>;
};

export const ParticipantPermissionTable = (props: Props) => {
    const {proposalPermissions} = props;

    const dataSource: Array<TableItemType> = useMemo(() => {
        return proposalPermissions.map(([proposalType, proposalPermissions]) => {
            return {
                proposalType: getICFirstKey(proposalType) as KeysOfUnion<ProposalType>,
                proposalPermissions: proposalPermissions.map<KeysOfUnion<ProposalPermission>>((proposalPermission) => {
                    return getICFirstKey(proposalPermission) as KeysOfUnion<ProposalPermission>;
                })
            };
        });
    }, [proposalPermissions]);

    return (
        <Space direction="vertical" size="small">
            <h2>User Permissions:</h2>
            <Table<TableItemType> dataSource={dataSource} rowKey={(record) => jsonStringify(record)} size="small" pagination={false}>
                <Table.Column<TableItemType> title="Proposal Type" dataIndex="proposalType" key="proposalType" />
                <Table.Column<TableItemType>
                    title="Proposal Permissions"
                    key="proposalPermissions"
                    render={(record: TableItemType) => {
                        return (
                            <Space direction="horizontal">
                                {record.proposalPermissions.map((v) => (
                                    <Tag key={v}>{v}</Tag>
                                ))}
                            </Space>
                        );
                    }}
                />
            </Table>
        </Space>
    );
};
