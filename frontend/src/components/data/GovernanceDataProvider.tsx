import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import _ from "lodash"
import {GetGovernanceResponse, Governance, GovernanceParticipant, ProposalType, VotingConfig} from "declarations/governance/governance.did";
import {Feature, getDefaultFeature, GFError, hasOwnProperty, KeysOfUnion, Record_Partial, simpleFeatureReducer} from "geekfactory-js-util";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import {Principal} from "@dfinity/principal";
import {getICFirstKey} from "geekfactory-ic-js-util";

type FetchGovernance = () => Promise<void>
type GetGovernanceParticipantByPrincipal = (principal: Principal) => GovernanceParticipant | undefined
type GetGovernanceVotingConfigurationByProposalType = (proposalType: KeysOfUnion<ProposalType>) => VotingConfig | undefined

export type GovernanceFeatureData = {
    governance: Governance
}
export type GovernanceFeature = Feature<GovernanceFeatureData | undefined>

type Context = {
    governance: GovernanceFeature
    fetchGovernance: FetchGovernance
    getGovernanceParticipantByPrincipal: GetGovernanceParticipantByPrincipal
    getGovernanceVotingConfigurationByProposalType: GetGovernanceVotingConfigurationByProposalType
}

const GovernanceDataContext = React.createContext<Context | undefined>(undefined);
export const useGovernanceDataContext = () => {
    const context = React.useContext<Context | undefined>(GovernanceDataContext);
    if (!context) {
        throw new Error("useGovernanceDataContext must be used within a GovernanceDataContext.Provider")
    }
    return context;
}

export const GovernanceDataProvider = (props: PropsWithChildren<any>) => {
    const actorsContext = useActorsContext();

    const [governance, updateGovernance] = useReducer<Reducer<GovernanceFeature, Record_Partial<GovernanceFeature>>>(
        simpleFeatureReducer,
        getDefaultFeature()
    )

    const fetchGovernance = useCallback(async () => {
        try {
            updateGovernance({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: GetGovernanceResponse = await governanceActor.get_governance({});
                console.log("get_governance response", response)
                unstable_batchedUpdates(() => {
                    updateGovernance({
                        status: {inProgress: false, loaded: true},
                        data: {governance: response.Ok.governance},
                        error: {isError: false, error: undefined},
                    })
                })
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error(`Fetching governance: caught error`, e);
            unstable_batchedUpdates(() => {
                updateGovernance({
                    status: {inProgress: false, loaded: true},
                    data: {governance: undefined},
                    error: {isError: true, error: error.toNativeError()},
                })
            })
        }
    }, [actorsContext.getGovernanceActor])

    const getGovernanceParticipantByPrincipal = useCustomCompareCallback<GetGovernanceParticipantByPrincipal, [Array<[Principal, GovernanceParticipant]> | undefined]>((principal: Principal) => {
        return _.find(governance.data?.governance.participants, (participant) => {
            return participant[0].compareTo(principal) === "eq"
        })?.[1]
    }, [governance.data?.governance.participants], _.isEqual)

    const getGovernanceVotingConfigurationByProposalType = useCustomCompareCallback<GetGovernanceVotingConfigurationByProposalType, [Array<[ProposalType, VotingConfig]> | undefined]>((proposalType: KeysOfUnion<ProposalType>) => {
        return _.find(governance.data?.governance.voting_configuration, (votingConfiguration) => {
            return hasOwnProperty(votingConfiguration[0], proposalType)
        })?.[1]
    }, [governance.data?.governance.voting_configuration], _.isEqual)

    const value: Context = useCustomCompareMemo<Context, [
        GovernanceFeature, FetchGovernance,
        GetGovernanceParticipantByPrincipal,
        GetGovernanceVotingConfigurationByProposalType,
    ]>(() => ({
        governance,
        fetchGovernance,
        getGovernanceParticipantByPrincipal,
        getGovernanceVotingConfigurationByProposalType,
    }), [
        governance,
        fetchGovernance,
        getGovernanceParticipantByPrincipal,
        getGovernanceVotingConfigurationByProposalType,
    ], _.isEqual)

    return <GovernanceDataContext.Provider value={value}>
        {props.children}
    </GovernanceDataContext.Provider>
}