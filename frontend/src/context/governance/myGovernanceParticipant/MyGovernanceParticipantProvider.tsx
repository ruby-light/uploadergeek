import {isNullish} from '@dfinity/utils';
import type {GovernanceCanister} from 'frontend/src/api/hub/GovernanceCanister';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {hasProperty, type KeysOfUnion, type WithoutUndefined} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {ICErr} from 'frontend/src/utils/ic/api/useICCallTypedFor';

import {IS_DEV_ENVIRONMENT} from 'frontend/src/utils/env';
import {createContext, type PropsWithChildren, useCallback, useContext, useMemo} from 'react';
import type {GovernanceParticipant, ProposalPermission, ProposalType} from 'src/declarations/governance/governance.did';
import {apiLogger} from '../../logger/logger';

type HasProposalPermission = (proposalType: KeysOfUnion<ProposalType>, proposalPermission: KeysOfUnion<ProposalPermission>) => boolean;

type Context = {
    myGovernanceParticipant: GovernanceParticipant | undefined;
    feature: Feature;
    responseError: ICErr<GovernanceCanister, 'getMyGovernanceParticipant'> | undefined;
    fetchMyGovernanceParticipant: () => Promise<void>;
    hasProposalPermission: HasProposalPermission;
};

const Context = createContext<Context | undefined>(undefined);
export const useMyGovernanceParticipantContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useMyGovernanceParticipantContext must be used within a MyGovernanceParticipantProvider');
    }
    return context;
};
export const useMyGovernanceParticipantContextSafe = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useMyGovernanceParticipantContextSafe must be used within a MyGovernanceParticipantProvider');
    }
    if (isNullish(context.myGovernanceParticipant)) {
        throw new Error('useMyGovernanceParticipantContextSafe: participant is nullish');
    }
    return context as WithoutUndefined<Context, 'myGovernanceParticipant'>;
};

export const MyGovernanceParticipantProvider = (props: PropsWithChildren<any>) => {
    const {call, data: myGovernanceParticipant, feature, responseError} = useICCanisterCallGovernance('getMyGovernanceParticipant');

    const fetchMyGovernanceParticipant = useCallback(async () => {
        await call([], {
            logger: apiLogger,
            logMessagePrefix: 'getGovernance:',
            onBeforeRequest: async () => {
                if (IS_DEV_ENVIRONMENT) {
                    // await delayPromise(1000);
                    // throw new Error(`Simulated error in dev environment ${Date.now()}`);
                }
            }
        });
    }, [call]);

    const hasProposalPermission = useCallback<HasProposalPermission>(
        (proposalType, proposalPermission) => {
            return (
                myGovernanceParticipant?.participant?.proposal_permissions.some(([proposalType_, proposalPermission_]) => {
                    if (hasProperty(proposalType_, proposalType)) {
                        return proposalPermission_.some((v) => hasProperty(v, proposalPermission));
                    }
                    return false;
                }) ?? false
            );
        },
        [myGovernanceParticipant?.participant?.proposal_permissions]
    );

    const value: Context = useMemo<Context>(
        () => ({
            myGovernanceParticipant: myGovernanceParticipant?.participant,
            feature,
            responseError,
            fetchMyGovernanceParticipant,
            hasProposalPermission
        }),
        [myGovernanceParticipant?.participant, feature, responseError, fetchMyGovernanceParticipant, hasProposalPermission]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
