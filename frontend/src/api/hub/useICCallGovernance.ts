import {useCanisterContext} from 'frontend/src/context/canister/CanisterProvider';
import {useCallback, useMemo} from 'react';
import {useICCallTypedFor, type OnlyAsyncMethodNames} from '../../utils/ic/api/useICCallTypedFor';
import type {GovernanceCanister} from './GovernanceCanister';

const canisterId: string | undefined = import.meta.env.VITE_APP_BACKEND_CANISTER_ID;

const useGovernanceCanisterFactory = () => {
    const {getGovernanceCanister} = useCanisterContext();

    const getActor = useCallback(() => {
        return getGovernanceCanister(canisterId);
    }, [getGovernanceCanister]);

    return useMemo(() => ({getActor}), [getActor]);
};

export const useICCanisterCallGovernance = <K extends OnlyAsyncMethodNames<GovernanceCanister>>(method: K) => {
    const {getActor} = useGovernanceCanisterFactory();
    return useICCallTypedFor(getActor, method);
};
