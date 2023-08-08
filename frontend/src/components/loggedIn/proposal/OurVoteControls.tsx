import * as React from "react";
import {Reducer, useCallback, useReducer} from "react";
import _ from "lodash"
import {Proposal, VoteForProposalArgs, VoteForProposalError, VoteForProposalResponse} from "declarations/governance/governance.did";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {COLOR_DANGER_HEX, CumulativeInfo, CumulativeInfo_Partial, getDefaultCumulativeInfo, GFError, hasOwnProperty, KeysOfUnion, now, simpleFeatureReducer} from "geekfactory-js-util";
import {getICFirstKey} from "geekfactory-ic-js-util";
import PubSub from "pubsub-js";
import {useCustomCompareMemo} from "use-custom-compare";
import {useAuthProviderContext} from "geekfactory-ic-js-auth";
import {Button, Popconfirm, Space} from "antd";
import {FETCH_PROPOSAL_NOTIFICATION} from "src/components/loggedIn/proposal/ProposalPage";

type Props = {
    proposal: Proposal
}

export const OurVoteControls = (props: Props) => {
    const {proposal} = props;
    const {proposal_id: proposalId} = proposal

    const actorsContext = useActorsContext();

    const authProviderContext = useAuthProviderContext();
    const currentPrincipal = authProviderContext.getCurrentPrincipal();

    const weCanVote = useCustomCompareMemo(() => {
        return !_.some(proposal.voting.votes, v => {
            return _.isEqual(v.participant.toText(), currentPrincipal?.toText())
        })
    }, [proposal.voting.votes, currentPrincipal], _.isEqual)

    const [cumulativeInfo, updateCumulativeInfo] = useReducer<Reducer<CumulativeInfo, CumulativeInfo_Partial>>(
        simpleFeatureReducer,
        getDefaultCumulativeInfo()
    )

    const {inProgress} = cumulativeInfo.status

    const sendVote = useCallback(async (vote: boolean) => {
        try {
            updateCumulativeInfo({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const requestArgs: VoteForProposalArgs = {
                vote: vote,
                proposal_id: proposalId
            }
            console.log("vote_for_proposal requestArgs", requestArgs);

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: VoteForProposalResponse = await governanceActor.vote_for_proposal(requestArgs);
                console.log("vote_for_proposal response", response)
                if (hasOwnProperty(response, "Ok")) {
                    updateCumulativeInfo({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined},
                        time: {updatedAt: now()}
                    })
                    PubSub.publish(FETCH_PROPOSAL_NOTIFICATION, {})
                    return
                } else if (hasOwnProperty(response, "Err")) {
                    const errorName: KeysOfUnion<VoteForProposalError> = getICFirstKey(response.Err) as KeysOfUnion<VoteForProposalError>;
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
            console.error(`Voting for proposal[${proposalId} / ${vote}]: caught error`, e);
            updateCumulativeInfo({
                status: {inProgress: false, loaded: true},
                error: {isError: true, error: error.toNativeError()},
            })
        }
    }, [actorsContext.getGovernanceActor, proposalId])

    if (weCanVote) {
        const errorLabel = cumulativeInfo.error.isError ? <span style={{color: COLOR_DANGER_HEX}}>{cumulativeInfo.error.error?.message}</span> : undefined
        return <Space>
            <span>Please vote:</span>
            <Popconfirm title={"Are you sure to vote YES?"}
                        okButtonProps={{loading: inProgress, disabled: inProgress}}
                        cancelButtonProps={{loading: inProgress, disabled: inProgress}}
                        onConfirm={() => sendVote(true)}>
                <Button>Yes</Button>
            </Popconfirm>
            <Popconfirm title={"Are you sure to vote NO?"}
                        okButtonProps={{loading: inProgress, disabled: inProgress}}
                        cancelButtonProps={{loading: inProgress, disabled: inProgress}}
                        onConfirm={() => sendVote(false)}>
                <Button>No</Button>
            </Popconfirm>
            {errorLabel}
        </Space>
    }
    return null
}