import type {HttpAgent} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';
import {assertNonNullish} from '@dfinity/utils';
import {GovernanceCanister} from 'frontend/src/api/hub/GovernanceCanister';
import {toError} from 'frontend/src/utils/core/error/toError';
import {wrapWithTryCatch} from 'frontend/src/utils/core/object/objectProxyUtils';
import {isDelegationExpired} from 'frontend/src/utils/ic/delegationUtils';
import type {Logger} from 'frontend/src/utils/logger/Logger';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, type MutableRefObject, type PropsWithChildren} from 'react';
import {getCanisterPrincipalIfValid} from '../../utils/ic/principal';
import {useAgentContext} from '../agent/AgentProvider';
import {useAuthContext} from '../auth/AuthProvider';
import {delegationExpiredWillLogoutMessage} from '../logger/loggerConstants';

type GetGovernanceCanister = (canisterId: string | undefined) => Promise<GovernanceCanister>;

type Context = {
    getGovernanceCanister: GetGovernanceCanister;
};

const Context = createContext<Context | undefined>(undefined);
export function useCanisterContext() {
    const ctx = useContext(Context);
    if (!ctx) {
        throw new Error('useCanisterContext must be used within <CanisterProvider>');
    }
    return ctx;
}

export function CanisterProvider({children, logger}: PropsWithChildren<{logger: Logger}>) {
    const {isReady, isAuthenticated, identity, logout} = useAuthContext();
    const {getAgent} = useAgentContext();

    /**
    ==========================================
    Cache
    ==========================================
    */

    const governanceCanisterPromiseRef = useRef<Promise<GovernanceCanister> | undefined>(undefined);

    /**
    ==========================================
    Reset on identity change
    ==========================================
    */

    const prevPrincipalRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!isReady) {
            return;
        }
        const principal = isAuthenticated && identity != undefined ? identity.getPrincipal().toText() : undefined;
        if (prevPrincipalRef.current != principal) {
            prevPrincipalRef.current = principal;
            governanceCanisterPromiseRef.current = undefined;
        }
    }, [isReady, isAuthenticated, identity]);

    /**
    ==========================================
    Canister Services
    ==========================================
    */

    const getGovernanceCanister: GetGovernanceCanister = useCallback(
        async (canisterId: string | undefined) =>
            getCanisterCommon<GovernanceCanister>(getAgent, governanceCanisterPromiseRef, canisterId, (args) => {
                const actor = GovernanceCanister.create(args);
                const proxy = wrapWithTryCatch(actor, async (error) => {
                    if (isDelegationExpired(error)) {
                        logger.log(delegationExpiredWillLogoutMessage, {error});
                        await logout();
                    }
                });
                return proxy;
            }),
        [getAgent, logger, logout]
    );

    const value = useMemo<Context>(
        () => ({
            getGovernanceCanister
        }),
        [getGovernanceCanister]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

type CreateArgs = {agent: HttpAgent; canisterId: Principal};
async function getCanisterCommon<C>(
    getAgentFn: () => Promise<HttpAgent>,
    promiseRef: MutableRefObject<Promise<C> | undefined>,
    canisterId: string | undefined,
    create: (args: CreateArgs) => C
): Promise<C> {
    if (promiseRef.current) {
        return promiseRef.current;
    }

    const validCanisterPrincipal = getCanisterPrincipalIfValid(canisterId);
    assertNonNullish(validCanisterPrincipal, 'canisterId is invalid');

    const promise = (async () => {
        const agent = await getAgentFn();
        return create({agent, canisterId: validCanisterPrincipal});
    })();

    promiseRef.current = promise;

    try {
        return await promise;
    } catch (e) {
        promiseRef.current = undefined;
        throw toError(e);
    }
}
