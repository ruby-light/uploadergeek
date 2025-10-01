import type {Principal} from '@dfinity/principal';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {apiLogger} from 'frontend/src/context/logger/logger';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {hasProperty, type KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {IS_DEV_ENVIRONMENT} from 'frontend/src/utils/env';
import type {PropsWithChildren} from 'react';
import React, {useCallback, useEffect, useMemo} from 'react';
import type {Governance, GovernanceParticipant, ProposalType, VotingConfig} from 'src/declarations/governance/governance.did';

export const FETCH_CURRENT_GOVERNANCE_NOTIFICATION = 'FETCH_CURRENT_GOVERNANCE_NOTIFICATION';

type FetchGovernance = () => Promise<void>;
type GetGovernanceParticipantByPrincipal = (principal: Principal) => GovernanceParticipant | undefined;
type GetGovernanceVotingConfigurationByProposalType = (proposalType: KeysOfUnion<ProposalType>) => VotingConfig | undefined;

type Context = {
    governance: Governance | undefined;
    feature: Feature;
    fetchGovernance: FetchGovernance;
    getGovernanceParticipantByPrincipal: GetGovernanceParticipantByPrincipal;
    getGovernanceVotingConfigurationByProposalType: GetGovernanceVotingConfigurationByProposalType;
};

const GovernanceDataContext = React.createContext<Context | undefined>(undefined);
export const useGovernanceContext = () => {
    const context = React.useContext<Context | undefined>(GovernanceDataContext);
    if (!context) {
        throw new Error('useGovernanceContext must be used within a GovernanceContext.Provider');
    }
    return context;
};

export const GovernanceProvider = (props: PropsWithChildren<any>) => {
    const {call, data, feature} = useICCanisterCallGovernance('getGovernance');
    const governance = data?.governance;

    const fetchGovernance = useCallback(async () => {
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

    useEffect(() => {
        const token = PubSub.subscribe(FETCH_CURRENT_GOVERNANCE_NOTIFICATION, () => {
            fetchGovernance();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchGovernance]);

    const getGovernanceParticipantByPrincipal = useCallback<GetGovernanceParticipantByPrincipal>(
        (principal: Principal) => {
            return governance?.participants.find((participant) => {
                return participant[0].compareTo(principal) === 'eq';
            })?.[1];
        },
        [governance?.participants]
    );

    const getGovernanceVotingConfigurationByProposalType = useCallback<GetGovernanceVotingConfigurationByProposalType>(
        (proposalType: KeysOfUnion<ProposalType>) => {
            return governance?.voting_configuration.find((votingConfiguration) => {
                return hasProperty(votingConfiguration[0], proposalType);
            })?.[1];
        },
        [governance?.voting_configuration]
    );

    const value: Context = useMemo<Context>(
        () => ({
            governance,
            feature,
            fetchGovernance,
            getGovernanceParticipantByPrincipal,
            getGovernanceVotingConfigurationByProposalType
        }),
        [governance, feature, fetchGovernance, getGovernanceParticipantByPrincipal, getGovernanceVotingConfigurationByProposalType]
    );

    return <GovernanceDataContext.Provider value={value}>{props.children}</GovernanceDataContext.Provider>;
};
