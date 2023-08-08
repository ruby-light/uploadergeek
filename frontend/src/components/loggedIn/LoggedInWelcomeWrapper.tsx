import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer, useState} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {GetMyGovernanceParticipantResponse, GovernanceParticipant, ProposalPermission, ProposalType} from "declarations/governance/governance.did";
import {COLOR_DANGER_HEX, CumulativeInfo, CumulativeInfo_Partial, getDefaultCumulativeInfo, GFError, hasOwnProperty, KeysOfUnion, simpleFeatureReducer} from "geekfactory-js-util";
import {Principal} from "@dfinity/principal";
import {Spin, Typography} from "antd";
import {LogoutButton} from "src/components/loggedIn/LogoutButton";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {getICFirstKey} from "geekfactory-ic-js-util";

type FetchMyParticipant = () => Promise<void>
type HasProposalPermission = (proposalType: KeysOfUnion<ProposalType>, proposalPermission: KeysOfUnion<ProposalPermission>) => boolean

type Context = {
    participant: GovernanceParticipant
    fetchMyParticipant: FetchMyParticipant
    hasProposalPermission: HasProposalPermission
}
const CurrentParticipantContext = React.createContext<Context | undefined>(undefined);
export const useCurrentParticipantContext = () => {
    const context = React.useContext<Context | undefined>(CurrentParticipantContext);
    if (!context) {
        throw new Error("useCurrentParticipantContext must be used within a CurrentParticipantContext.Provider")
    }
    return context;
}

export const LoggedInWelcomeWrapper = (props: PropsWithChildren<any>) => {
    const actorsContext = useActorsContext();

    const [notRegisteredPrincipal, setNotRegisteredPrincipal] = useState<Principal | undefined>(undefined)
    const [registeredParticipant, setRegisteredParticipant] = useState<GovernanceParticipant | undefined>(undefined)

    const [myParticipantCumulativeInfo, updateMyParticipantCumulativeInfo] = useReducer<Reducer<CumulativeInfo, CumulativeInfo_Partial>>(
        simpleFeatureReducer,
        getDefaultCumulativeInfo()
    )

    const hasProposalPermission = useCustomCompareCallback<HasProposalPermission, [Array<[ProposalType, Array<ProposalPermission>]> | undefined]>((proposalType, proposalPermission) => {
        return _.some(registeredParticipant?.proposal_permissions, ([proposalType_, proposalPermission_]) => {
            if (getICFirstKey(proposalType_) === proposalType) {
                return _.some(proposalPermission_, v => getICFirstKey(v) === proposalPermission)
            }
            return false
        })
    }, [registeredParticipant?.proposal_permissions], _.isEqual)

    const fetchMyParticipant = useCallback(async () => {
        try {
            updateMyParticipantCumulativeInfo({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: GetMyGovernanceParticipantResponse = await governanceActor.get_my_governance_participant({});
                console.log("get_my_governance_participant response", response)
                if (hasOwnProperty(response, "Ok")) {
                    unstable_batchedUpdates(() => {
                        setNotRegisteredPrincipal(undefined)
                        setRegisteredParticipant(response.Ok.participant)
                        updateMyParticipantCumulativeInfo({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined},
                        })
                    })
                } else if (hasOwnProperty(response, "Err")) {
                    unstable_batchedUpdates(() => {
                        setNotRegisteredPrincipal(response.Err.NotRegistered.your_principal)
                        setRegisteredParticipant(undefined)
                        updateMyParticipantCumulativeInfo({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined},
                        })
                    })
                } else {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("unknown")
                }
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error(`Fetching logged in participant: caught error`, e);
            unstable_batchedUpdates(() => {
                setNotRegisteredPrincipal(undefined)
                setRegisteredParticipant(undefined)
                updateMyParticipantCumulativeInfo({
                    status: {inProgress: false, loaded: true},
                    error: {isError: true, error: error.toNativeError()},
                })
            })
        }
    }, [actorsContext.getGovernanceActor])


    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchMyParticipant()
    }, [fetchMyParticipant])

    const headerComponent = <>
        <h1>Welcome <LogoutButton/></h1>
    </>

    const value: Context = useCustomCompareMemo<Context, [
        GovernanceParticipant, FetchMyParticipant,
        HasProposalPermission,
    ]>(() => ({
        participant: registeredParticipant!,
        fetchMyParticipant,
        hasProposalPermission,
    }), [
        registeredParticipant!,
        fetchMyParticipant,
        hasProposalPermission,
    ], _.isEqual)

    if (!myParticipantCumulativeInfo.status.loaded) {
        return <>
            {headerComponent}
            <Spin/>
        </>
    }

    if (myParticipantCumulativeInfo.error.isError) {
        return <>
            {headerComponent}
            <div style={{color: COLOR_DANGER_HEX}}>Failed to load participant: {myParticipantCumulativeInfo.error.error?.message}</div>
        </>
    }

    if (notRegisteredPrincipal) {
        return <>
            {headerComponent}
            <div>You are not registered as a governance participant.
                <br/>
                Your principal is <Typography.Text copyable>{notRegisteredPrincipal.toString()}</Typography.Text>
            </div>
        </>
    }

    if (registeredParticipant == undefined) {
        return <>
            {headerComponent}
            <div style={{color: COLOR_DANGER_HEX}}>
                Illegal state: no registered participant
            </div>
        </>
    }

    return <CurrentParticipantContext.Provider value={value}>
        {props.children}
    </CurrentParticipantContext.Provider>
}