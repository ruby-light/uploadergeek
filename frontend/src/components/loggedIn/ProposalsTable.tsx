import * as React from "react";
import _ from "lodash"
import {ProposalInfo} from "declarations/governance/governance.did";
import {useCustomCompareMemo} from "use-custom-compare";
import {ColumnsType} from "antd/lib/table/index";
import {Space, Table, Tag} from "antd";
import {COLOR_ADDITIONAL_INFO_HEX, formatDate} from "geekfactory-js-util";
import {CopyablePrincipalComponent} from "src/components/common/CopyablePrincipalComponent";
import {getICFirstKey, getICOptional} from "geekfactory-ic-js-util";
import {Link} from "react-router-dom";
import {useGovernanceDataContext} from "src/components/data/GovernanceDataProvider";

type Props = {
    proposals: Array<ProposalInfo> | undefined
}

type TableItemType = {
    proposalId: number
    proposalType: string
    createdMillis: number
    initiator: string
    initiatorName: string
    description: string
    state: string
}

export const ProposalsTable = (props: Props) => {
    const {proposals} = props
    const governanceDataContext = useGovernanceDataContext();

    const dataSource: Array<TableItemType> = useCustomCompareMemo(() => {
        return _.sortBy(_.map(proposals, (proposal) => {
            return {
                proposalId: Number(proposal.proposal_id),
                proposalType: getICFirstKey(proposal.proposal.detail),
                createdMillis: Number(proposal.proposal.created),
                initiator: proposal.proposal.initiator.toString(),
                initiatorName: governanceDataContext.getGovernanceParticipantByPrincipal(proposal.proposal.initiator)?.name || "",
                description: getICOptional(proposal.proposal.description) || "",
                state: getICFirstKey(proposal.proposal.state),
            }
        }), v => v.createdMillis)
    }, [proposals, governanceDataContext.getGovernanceParticipantByPrincipal], _.isEqual)

    const columns: ColumnsType<TableItemType> = useCustomCompareMemo(() => {
        return _.compact([
            {
                title: "Proposal ID",
                render: (value, record) => <Link to={`/proposal/${record.proposalId}`}><u>{record.proposalId}</u></Link>,
                sorter: (a, b) => a.proposalId - b.proposalId,
                sortDirections: ["descend", "ascend"],
            },
            {
                title: "Proposal Type",
                render: (value, record) => <Tag>{record.proposalType}</Tag>,
                // sorter: (a, b) => a.proposalType.localeCompare(b.proposalType),
                // sortDirections: ["descend", "ascend"],
            },
            {
                title: "Created, UTC",
                render: (value, record) => formatDate(record.createdMillis, "dayTimeSeconds"),
                sorter: (a, b) => a.createdMillis - b.createdMillis,
                sortDirections: ["descend", "ascend"],
            },
            {
                title: "Initiator",
                render: (value, record) => <Space direction={"vertical"} size={0}>
                    <CopyablePrincipalComponent principal={record.initiator}/>
                    <span style={{color: COLOR_ADDITIONAL_INFO_HEX}}>{record.initiatorName}</span>
                </Space>,
                // sorter: (a, b) => a.initiator.localeCompare(b.initiator),
                // sortDirections: ["descend", "ascend"],
            },
            {
                title: "State",
                render: (value, record) => record.state,
                // sorter: (a, b) => a.state.localeCompare(b.state),
                // sortDirections: ["descend", "ascend"],
            },
            {
                title: "Description",
                render: (value, record) => record.description,
                // sorter: (a, b) => a.description.localeCompare(b.description),
                // sortDirections: ["descend", "ascend"],
            },
        ]) as ColumnsType<TableItemType>
    }, [], _.isEqual)

    return <Table<TableItemType> dataSource={dataSource}
                                 columns={columns}
                                 rowKey={record => `${record.proposalId.toString()}`}
                                 pagination={false}
                                 showSorterTooltip={false}
    />
}