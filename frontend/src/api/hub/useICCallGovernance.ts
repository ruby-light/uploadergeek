import {useCanisterContext} from 'frontend/src/context/canister/CanisterProvider';
import {useCurrentCanisterIdContextSafe} from 'frontend/src/context/canisterId/CurrentCanisterIdProvider';
import {useCallback, useMemo} from 'react';
import {useICCallTypedFor, type OnlyAsyncMethodNames} from '../../utils/ic/api/useICCallTypedFor';
import type {GovernanceCanister} from './GovernanceCanister';

const useGovernanceCanisterFactory = () => {
    const {currentCanisterId} = useCurrentCanisterIdContextSafe();
    const {getGovernanceCanister} = useCanisterContext();

    const getActor = useCallback(() => {
        return getGovernanceCanister(currentCanisterId);
    }, [getGovernanceCanister, currentCanisterId]);

    return useMemo(() => ({getActor}), [getActor]);
};

export const useICCanisterCallGovernance = <K extends OnlyAsyncMethodNames<GovernanceCanister>>(method: K) => {
    const {getActor} = useGovernanceCanisterFactory();
    return useICCallTypedFor(getActor, method);
};
