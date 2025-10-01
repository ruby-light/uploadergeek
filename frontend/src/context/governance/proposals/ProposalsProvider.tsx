import type {TablePaginationConfig} from 'antd';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {useRemoteListWithUrlState, type ListState, type RemoteDataProvider, type RemoteListWithUrlStateOptions, type RemoteListWithUrlStateResult} from 'frontend/src/hook/useRemoteListWithUrlState';
import type {PropsWithChildren} from 'react';
import {createContext, useCallback, useContext, useEffect, useMemo} from 'react';
import type {GetProposalsResult, ProposalInfo} from 'src/declarations/governance/governance.did';
import {applicationLogger} from '../../logger/logger';
import {useProposals, type FetchChunkParameters} from './useProposals';

export const REFRESH_PROPOSALS_TOPIC = 'REFRESH_PROPOSALS_TOPIC';

export type RemoteDataItemType = ProposalInfo;

type Context = RemoteListWithUrlStateResult<RemoteDataItemType> & {
    initialState: ListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useProposalsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useProposalsProviderContext must be used within a ProposalsProvider');
    }
    return context;
};

export const ProposalsProvider = (props: PropsWithChildren) => {
    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchProposalsChunk} = useProposals();

    const remoteDataProvider: RemoteDataProvider<RemoteDataItemType> = useCallback(
        async (listState: ListState) => {
            const {currentPage, pageSize} = listState;
            const start = (currentPage - 1) * pageSize;
            const fetchChunkParameters: FetchChunkParameters = {
                count: pageSize,
                start: start
            };
            const result: GetProposalsResult = await fetchProposalsChunk(fetchChunkParameters);
            return {
                data: result.proposals,
                total: Number(result.total_count)
            };
        },
        [fetchProposalsChunk]
    );

    const initialState: ListState = useMemo(() => {
        return {
            currentPage: 1,
            pageSize: PAGE_SIZE.DEFAULT
        };
    }, []);

    const listOptions: RemoteListWithUrlStateOptions = useMemo(() => {
        return {
            initialState,
            queryParametersPrefix: 'proposals.'
        };
    }, [initialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType>(remoteDataProvider, listOptions, applicationLogger, 'ProposalsProvider');
    const {listState, listTotalSize, fetchRemoteData} = remoteListWithUrlState;

    const pagination: TablePaginationConfig = useMemo(() => {
        return {
            ...defaultPagination,
            current: listState.currentPage,
            pageSize: listState.pageSize,
            total: listTotalSize
        };
    }, [defaultPagination, listState.currentPage, listState.pageSize, listTotalSize]);

    useEffect(() => {
        const token = PubSub.subscribe(REFRESH_PROPOSALS_TOPIC, () => {
            fetchRemoteData();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchRemoteData]);

    const value: Context = useMemo(
        () => ({
            ...remoteListWithUrlState,
            initialState,
            pagination
        }),
        [remoteListWithUrlState, initialState, pagination]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
