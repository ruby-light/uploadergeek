import * as React from "react";
import {Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {Feature, getDefaultFeature, GFError, hasOwnProperty, now, Record_Partial, simpleFeatureReducer} from "geekfactory-js-util";
import {GetProposalsResponse, ProposalInfo} from "declarations/governance/governance.did";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {Space} from "antd";
import {AddProposalModalButton} from "src/components/loggedIn/addProposalModal/AddProposalModalButton";
import {ProposalsTable} from "src/components/loggedIn/ProposalsTable";
import PubSub from "pubsub-js";

type Props = {}

type ProposalsFeatureData = {
    proposals: Array<ProposalInfo>
}
type ProposalsFeature = Feature<ProposalsFeatureData | undefined>

export const REFRESH_PROPOSALS_TOPIC = "REFRESH_PROPOSALS_TOPIC"

export const ProposalsSection = (props: Props) => {
    const actorsContext = useActorsContext();

    const [proposals, updateProposals] = useReducer<Reducer<ProposalsFeature, Record_Partial<ProposalsFeature>>>(
        simpleFeatureReducer,
        getDefaultFeature()
    )

    const fetchProposals = useCallback(async () => {
        try {
            updateProposals({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: GetProposalsResponse = await governanceActor.get_proposals({});
                console.log("get_proposals response", response)
                if (hasOwnProperty(response, "Ok")) {
                    updateProposals({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined},
                        data: {
                            proposals: response.Ok.proposals
                        },
                        time: {updatedAt: now()}
                    })
                } else {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("unknown")
                }
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error(`Fetching proposals: caught error`, e);
            updateProposals({
                status: {inProgress: false, loaded: true},
                error: {isError: true, error: error.toNativeError()},
            })
        }
    }, [actorsContext.getGovernanceActor])

    useEffect(() => {
        const token = PubSub.subscribe(REFRESH_PROPOSALS_TOPIC, (message, data: any) => {
            // noinspection JSIgnoredPromiseFromCall
            fetchProposals();
        });
        return () => {
            PubSub.unsubscribe(token)
        }
    }, [fetchProposals])

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchProposals()
    }, [fetchProposals]);

    return <Space direction={"vertical"} size={"small"}>
        <h2>Proposals:</h2>
        <AddProposalModalButton/>
        <ProposalsTable proposals={proposals.data?.proposals}/>
    </Space>
}