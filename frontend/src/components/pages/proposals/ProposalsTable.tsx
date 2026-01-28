import {fromNullable} from '@dfinity/utils';
import {Flex, Table, Tag, type TableColumnsType, type TablePaginationConfig, type TableProps} from 'antd';
import type {FilterValue, SorterResult} from 'antd/es/table/interface';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {useGovernanceContext} from 'frontend/src/context/governance/GovernanceProvider';
import {useProposalsProviderContext, type RemoteDataItemType} from 'frontend/src/context/governance/proposals/ProposalsProvider';
import {prepareTableParamsFiltersFromTableOnChange, prepareTableParamsSortItemsFromTableOnChange, type ListState} from 'frontend/src/hook/useRemoteListWithUrlState';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import {formatDateAgo} from 'frontend/src/utils/core/date/format';
import {extractValidPositiveInteger} from 'frontend/src/utils/core/number/transform';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {DateTimeResponsive} from '../../widgets/DateTimeResponsive';
import {QuestionPopover} from '../../widgets/QuestionPopover';
import {spinLoading} from '../../widgets/spinUtils';
import {DataEmptyStub} from '../../widgets/stub/DataEmptyStub';
import {CopyableUIDComponent} from '../../widgets/uid/CopyableUIDComponent';

type TableItemType = RemoteDataItemType;

export const ProposalsTable = () => {
    const {updateListState, feature, remoteData, fetchRemoteData, initialState, pagination} = useProposalsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const {getGovernanceParticipantByPrincipal} = useGovernanceContext();

    const rowKey = useCallback((record: TableItemType) => record.proposal_id.toString(), []);

    const columns: TableColumnsType<TableItemType> = useMemo(() => {
        const array: TableColumnsType<TableItemType> = [
            {
                title: 'ID',
                render: (record: TableItemType) => (
                    <Link to={`/proposal/${record.proposal_id.toString()}`}>
                        <u>{record.proposal_id.toString()}</u>
                    </Link>
                ),
                className: 'gf-noWrap'
            },
            {
                title: 'Proposal Type',
                render: (record: TableItemType) => getICFirstKey(record.proposal.detail) ?? '-',
                className: 'gf-noWrap'
            },
            {
                title: 'State',
                render: (record: TableItemType) => {
                    if (hasProperty(record.proposal.state, 'Voting')) {
                        const votes = isEmptyArray(record.proposal.voting.votes) ? 'no votes' : `${record.proposal.voting.votes.length} votes`;
                        return (
                            <Flex vertical>
                                <span>Voting</span>
                                <span className="gf-ant-color-secondary gf-font-size-smaller">{votes}</span>
                            </Flex>
                        );
                    } else if (hasProperty(record.proposal.state, 'Approved')) {
                        return <Tag color="blue">Approved</Tag>;
                    } else if (hasProperty(record.proposal.state, 'Declined')) {
                        return <Tag color="red">Declined</Tag>;
                    } else if (hasProperty(record.proposal.state, 'Performed')) {
                        return <Tag color="green">Performed</Tag>;
                    }
                    return '-';
                }
            },
            {
                title: 'Created, UTC',
                render: (record: TableItemType) => (
                    <Flex vertical>
                        <DateTimeResponsive timeMillis={record.proposal.created} forceBreakLines />
                        <div className="gf-ant-color-secondary">{formatDateAgo(Number(record.proposal.created))}</div>
                    </Flex>
                ),
                className: 'gf-noWrap'
            },
            {
                title: 'Initiator',
                render: (record: TableItemType) => (
                    <Flex gap={8} className="gf-ant-color-secondary" style={{minWidth: 100}}>
                        <span>{getGovernanceParticipantByPrincipal(record.proposal.initiator)?.name ?? '-'}</span>
                        <QuestionPopover content={<CopyableUIDComponent uid={record.proposal.initiator.toText()} />} />
                    </Flex>
                )
            },
            {
                title: 'Description',
                render: (record: TableItemType) => fromNullable(record.proposal.description),
                className: 'gf-preLine'
            }
        ];
        return compactArray(array);
    }, [getGovernanceParticipantByPrincipal]);

    const handleTableChange: TableProps<TableItemType>['onChange'] = useCallback(
        (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | Array<SorterResult<any>>) => {
            const currentPage = extractValidPositiveInteger(`${pagination.current}`) ?? initialState.currentPage;
            const pageSize = extractValidPositiveInteger(`${pagination.pageSize}`) ?? initialState.pageSize;

            const newParams: ListState = {
                currentPage,
                pageSize,
                filters: prepareTableParamsFiltersFromTableOnChange(filters),
                sort: prepareTableParamsSortItemsFromTableOnChange(sorter)
            };
            updateListState(newParams);
        },
        [initialState.currentPage, initialState.pageSize, updateListState]
    );

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.common.error.unableTo} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} label={i18.common.button.retryButton} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description="No Proposals" />;
        }
        return (
            <Table<TableItemType>
                columns={columns}
                rowKey={rowKey}
                dataSource={remoteData}
                pagination={pagination}
                loading={componentLoading}
                onChange={handleTableChange}
                showSorterTooltip={false}
                size="small"
                scroll={{x: 900}}
            />
        );
    } else {
        return <PanelLoadingComponent message="Loading proposals..." />;
    }
};
