import * as React from "react";
import _ from "lodash"
import {ProposalPermission, ProposalType} from "declarations/governance/governance.did";
import {KeysOfUnion} from "geekfactory-js-util";
import {useCustomCompareMemo} from "use-custom-compare";
import {getICFirstKey, jsonStringify} from "geekfactory-ic-js-util";
import {Space, Table, Tag} from "antd";

type Props = {
    proposalPermissions: Array<[ProposalType, Array<ProposalPermission>]>,
}

type TableItemType = {
    proposalType: KeysOfUnion<ProposalType>,
    proposalPermissions: Array<KeysOfUnion<ProposalPermission>>,
}

export const ParticipantPermissionTable = (props: Props) => {
    const {proposalPermissions} = props

    const dataSource: Array<TableItemType> = useCustomCompareMemo(() => {
        return _.map(proposalPermissions, ([proposalType, proposalPermissions]) => {
            return {
                proposalType: getICFirstKey(proposalType) as KeysOfUnion<ProposalType>,
                proposalPermissions: _.map<ProposalPermission, KeysOfUnion<ProposalPermission>>(proposalPermissions, (proposalPermission) => {
                    return getICFirstKey(proposalPermission) as KeysOfUnion<ProposalPermission>
                })
            }
        })
    }, [proposalPermissions], _.isEqual)

    return <Space direction={"vertical"} size={"small"}>
        <h2>User Permissions:</h2>
        <Table<TableItemType> dataSource={dataSource} rowKey={record => jsonStringify(record)} size={"small"} pagination={false}>
            <Table.Column<TableItemType> title={"Proposal Type"} dataIndex={"proposalType"} key={"proposalType"}/>
            <Table.Column<TableItemType> title={"Proposal Permissions"} key={"proposalPermissions"} render={(value, record) => {
                return <Space direction={"horizontal"}>{_.map(record.proposalPermissions, v => <Tag key={v}>{v}</Tag>)}</Space>
            }}/>
        </Table>
    </Space>
}