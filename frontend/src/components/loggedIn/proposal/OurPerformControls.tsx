import * as React from "react";
import {Reducer, useCallback, useReducer} from "react";
import _ from "lodash"
import {GetProposalArgs, PerformProposalError, PerformProposalResponse, Proposal, ProposalType} from "declarations/governance/governance.did";
import {useAuthProviderContext} from "geekfactory-ic-js-auth";
import {COLOR_DANGER_HEX, CumulativeInfo, CumulativeInfo_Partial, getDefaultCumulativeInfo, GFError, hasOwnProperty, KeysOfUnion, now, simpleFeatureReducer} from "geekfactory-js-util";
import {useCurrentParticipantContext} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {getICFirstKey} from "geekfactory-ic-js-util";
import {Button, Popconfirm, Space} from "antd";
import PubSub from "pubsub-js";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {FETCH_PROPOSAL_NOTIFICATION} from "src/components/loggedIn/proposal/ProposalPage";

type Props = {
    proposal: Proposal
}

export const OurPerformControls = (props: Props) => {
    const {proposal} = props;
    const {proposal_id: proposalId} = proposal

    const actorsContext = useActorsContext();

    const {participant, fetchMyParticipant, hasProposalPermission} = useCurrentParticipantContext();

    const authProviderContext = useAuthProviderContext();
    const currentPrincipal = authProviderContext.getCurrentPrincipal();

    const [cumulativeInfo, updateCumulativeInfo] = useReducer<Reducer<CumulativeInfo, CumulativeInfo_Partial>>(
        simpleFeatureReducer,
        getDefaultCumulativeInfo()
    )
    const {inProgress} = cumulativeInfo.status

    const sendPerform = useCallback(async () => {
        try {
            updateCumulativeInfo({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const requestArgs: GetProposalArgs = {
                proposal_id: proposalId
            }
            console.log("perform_proposal requestArgs", requestArgs);

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: PerformProposalResponse = await governanceActor.perform_proposal(requestArgs);
                console.log("perform_proposal response", response)
                if (hasOwnProperty(response, "Ok")) {
                    updateCumulativeInfo({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined},
                        time: {updatedAt: now()}
                    })
                    PubSub.publish(FETCH_PROPOSAL_NOTIFICATION, {})
                    await fetchMyParticipant()
                    return
                } else if (hasOwnProperty(response, "Err")) {
                    const errorName: KeysOfUnion<PerformProposalError> = getICFirstKey(response.Err) as KeysOfUnion<PerformProposalError>;
                    updateCumulativeInfo({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: new Error(errorName)},
                        time: {updatedAt: now()}
                    })
                } else {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("unknown")
                }
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error(`Performing proposal[${proposalId}]: caught error`, e);
            updateCumulativeInfo({
                status: {inProgress: false, loaded: true},
                error: {isError: true, error: error.toNativeError()},
            })
        }
    }, [actorsContext.getGovernanceActor, proposalId, fetchMyParticipant])


    if (!hasOwnProperty(proposal.state, "Approved")) {
        return null
    }

    if (!hasProposalPermission(getICFirstKey(proposal.detail) as KeysOfUnion<ProposalType>, "Perform")) {
        return null
    }

    // const weCanPerform = _.some(participant.proposal_permissions, (v) => {
    //     return (hasOwnProperty(v[0], "UpdateGovernance") || hasOwnProperty(v[0], "CallCanister")) && _.some(v[1], p => hasOwnProperty(p, "Perform"));
    // })
    //
    // if (!weCanPerform) {
    //     return null
    // }

    const errorLabel = cumulativeInfo.error.isError ? <span style={{color: COLOR_DANGER_HEX}}>{cumulativeInfo.error.error?.message}</span> : undefined
    return <Space>
        <Popconfirm title={"Are you sure to perform?"}
                    okButtonProps={{loading: inProgress, disabled: inProgress}}
                    cancelButtonProps={{loading: inProgress, disabled: inProgress}}
                    onConfirm={() => sendPerform()}>
            <Button>Perform</Button>
        </Popconfirm>
        {errorLabel}
    </Space>
}