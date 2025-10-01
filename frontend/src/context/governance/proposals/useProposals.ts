import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {toError} from 'frontend/src/utils/core/error/toError';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {GetProposalsArgs, GetProposalsResult} from 'src/declarations/governance/governance.did';
import {apiLogger} from '../../logger/logger';
import {caughtErrorMessage} from '../../logger/loggerConstants';

export type FetchChunkParameters = {
    count: number;
    start: number;
};
type Context = {
    fetchChunk: (parameters: FetchChunkParameters) => Promise<GetProposalsResult>;
};

export const useProposals = (): Context => {
    const {call} = useICCanisterCallGovernance('getProposals');

    const fetchChunk = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: FetchChunkParameters) => {
                const logMessagePrefix = `useContractEvents:`;
                try {
                    const chunkArgs: GetProposalsArgs = {
                        ascending: false,
                        count: BigInt(parameters.count),
                        start: BigInt(parameters.start)
                    };
                    const response = await call([chunkArgs], {
                        logger: apiLogger,
                        logMessagePrefix,
                        onBeforeRequest: async () => {
                            // await delayPromise(1000);
                        },
                        onResponseErrorBeforeExit: async (responseError) => {
                            throw toError(getICFirstKey(responseError));
                        }
                    });
                    if (hasProperty(response, 'Ok')) {
                        return response.Ok;
                    } else if (hasProperty(response, 'Err')) {
                        throw toError(getICFirstKey(response.Err));
                    }
                    throw response.Thrown;
                } catch (e) {
                    apiLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    throw toError(e);
                }
            }),
        [call]
    );

    return useMemo(() => ({fetchChunk}), [fetchChunk]);
};
