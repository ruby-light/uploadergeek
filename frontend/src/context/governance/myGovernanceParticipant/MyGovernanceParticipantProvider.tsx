import {isNullish} from '@dfinity/utils';
import type {GovernanceCanister} from 'frontend/src/api/hub/GovernanceCanister';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {apiLogger} from 'frontend/src/context/logger/logger';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {hasProperty, type KeysOfUnion, type WithoutUndefined} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {ICCall, ICErr} from 'frontend/src/utils/ic/api/useICCallTypedFor';

import {createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo} from 'react';
import type {GovernanceParticipant, ProposalPermission, ProposalType} from 'src/declarations/governance/governance.did';

type HasProposalPermission = (proposalType: KeysOfUnion<ProposalType>, proposalPermission: KeysOfUnion<ProposalPermission>) => boolean;

type Context = {
    myGovernanceParticipant: GovernanceParticipant | undefined;
    feature: Feature;
    responseError: ICErr<GovernanceCanister, 'getMyGovernanceParticipant'> | undefined;
    fetchMyGovernanceParticipant: ICCall<GovernanceCanister, 'getMyGovernanceParticipant'>;
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
    const {call: fetchMyGovernanceParticipant, data: myGovernanceParticipant, feature, responseError} = useICCanisterCallGovernance('getMyGovernanceParticipant');

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

    useEffect(() => {
        fetchMyGovernanceParticipant([], {logger: apiLogger, logMessagePrefix: `getMyGovernanceParticipant:`});
    }, [fetchMyGovernanceParticipant]);

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
