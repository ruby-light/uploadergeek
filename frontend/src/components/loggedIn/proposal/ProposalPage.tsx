import * as React from "react";
import {Reducer, useCallback, useEffect, useReducer} from "react";
import {Descriptions, Input, Space, Spin, Tag, Typography} from "antd";
import {useCurrentParticipantContext} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {Toolbar} from "src/components/loggedIn/Toolbar";
import {CallCanister, GetProposalArgs, GetProposalError, GetProposalResponse, Governance, Proposal, Vote} from "declarations/governance/governance.did";
import {COLOR_DANGER_HEX, Feature, formatDate, getDefaultFeature, GFError, hasOwnProperty, KeysOfUnion, now, Record_Partial, simpleFeatureReducer, truncateMiddle} from "geekfactory-js-util";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {getICFirstKey, getICOptional, toHexString} from "geekfactory-ic-js-util";
import {CopyablePrincipalComponent} from "src/components/common/CopyablePrincipalComponent";
import {OurVoteControls} from "src/components/loggedIn/proposal/OurVoteControls";
import PubSub from "pubsub-js";
import _ from "lodash"
import {useCustomCompareMemo} from "use-custom-compare";
import {OurPerformControls} from "src/components/loggedIn/proposal/OurPerformControls";
import {GovernanceInfo} from "src/components/loggedIn/GovernanceInfo";
import {useGovernanceDataContext} from "src/components/data/GovernanceDataProvider";

type ProposalFeatureData = {
    proposal: Proposal
}
type ProposalFeature = Feature<ProposalFeatureData | undefined>

type Props = {
    proposalId: number
}

export const FETCH_PROPOSAL_NOTIFICATION = "FETCH_PROPOSAL_NOTIFICATION"

export const ProposalPage = (props: Props) => {
    const {proposalId} = props;
    const {participant} = useCurrentParticipantContext();
    const actorsContext = useActorsContext();

    const [proposal, updateProposal] = useReducer<Reducer<ProposalFeature, Record_Partial<ProposalFeature>>>(
        simpleFeatureReducer,
        getDefaultFeature()
    )

    const fetchProposal = useCallback(async () => {
        try {
            updateProposal({status: {inProgress: true}})

            /*if (process.env.NODE_ENV === "development") {
                await delayPromise(1000)
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("unknown")
            }*/

            const requestArgs: GetProposalArgs = {
                proposal_id: BigInt(proposalId)
            }
            console.log("get_proposal requestArgs", requestArgs);

            const governanceActor = await actorsContext.getGovernanceActor();
            if (governanceActor) {
                const response: GetProposalResponse = await governanceActor.get_proposal(requestArgs);
                console.log("get_proposal response", response)
                if (hasOwnProperty(response, "Ok")) {
                    updateProposal({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined},
                        data: {
                            proposal: response.Ok.proposal
                        },
                        time: {updatedAt: now()}
                    })
                } else if (hasOwnProperty(response, "Err")) {
                    const errorName: KeysOfUnion<GetProposalError> = getICFirstKey(response.Err) as KeysOfUnion<GetProposalError>;
                    updateProposal({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: new Error(errorName)},
                        data: undefined,
                        time: {updatedAt: now()}
                    })
                } else {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("unknown")
                }
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error(`Fetching proposal[${proposalId}]: caught error`, e);
            updateProposal({
                status: {inProgress: false, loaded: true},
                error: {isError: true, error: error.toNativeError()},
            })
        }
    }, [actorsContext.getGovernanceActor, proposalId])

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchProposal()
    }, [fetchProposal]);

    useEffect(() => {
        const token = PubSub.subscribe(FETCH_PROPOSAL_NOTIFICATION, () => {
            // noinspection JSIgnoredPromiseFromCall
            fetchProposal()
        });
        return () => {
            PubSub.unsubscribe(token)
        }
    }, [fetchProposal])

    const pageHeader = <Space direction={"vertical"} size={0}>
        <h2 style={{margin: 0}}>Proposal: {proposalId}</h2>
    </Space>

    if (!proposal.status.loaded) {
        return <Space direction={"vertical"} style={{width: "100%"}}>
            <Toolbar/>
            {pageHeader}
            <Spin/>
        </Space>
    }

    if (proposal.error.isError || proposal.data?.proposal == undefined) {
        return <Space direction={"vertical"} style={{width: "100%"}}>
            <Toolbar/>
            {pageHeader}
            <div style={{color: COLOR_DANGER_HEX}}>Failed to load proposal: {proposal.error.error?.message}</div>
        </Space>
    }
    return <Space direction={"vertical"} style={{width: "100%"}}>
        <Toolbar/>
        {pageHeader}
        <ProposalInfo proposal={proposal.data.proposal}/>
    </Space>
}

const ProposalInfo = (props: { proposal: Proposal }) => {
    const {proposal} = props;

    return <Space direction={"vertical"}>
        <Descriptions bordered column={1} size={"small"}>
            <Descriptions.Item label={"Proposal ID"}>{proposal.proposal_id.toString()}</Descriptions.Item>
            <Descriptions.Item label={"Initiator"}><CopyablePrincipalComponent principal={proposal.initiator.toText()}/></Descriptions.Item>
            <Descriptions.Item label={"State"}>{getICFirstKey(proposal.state)}</Descriptions.Item>
            <Descriptions.Item label={"Created"}>{formatDate(Number(proposal.created), "dayTimeSeconds")}</Descriptions.Item>
            <Descriptions.Item label={"Updated"}>{formatDate(Number(proposal.updated), "dayTimeSeconds")}</Descriptions.Item>
            <Descriptions.Item label={"Description"}>{getICOptional(proposal.description) || ""}</Descriptions.Item>
            <Descriptions.Item label={"Voting"}><ProposalVotingInfoAndControls proposal={proposal}/></Descriptions.Item>
        </Descriptions>
        <ProposalAdditionalInfo proposal={proposal}/>
    </Space>
}

const ProposalAdditionalInfo = (props: { proposal: Proposal }) => {
    const {proposal} = props;
    if (hasOwnProperty(proposal.detail, "UpdateGovernance")) {
        return <ProposalUpdateGovernanceAdditionalInfo proposal={proposal} newGovernance={proposal.detail.UpdateGovernance.new_governance}/>
    } else if (hasOwnProperty(proposal.detail, "CallCanister")) {
        return <ProposalCallCanisterAdditionalInfo proposal={proposal} task={proposal.detail.CallCanister.task}/>
    }
    return null
}

const ProposalUpdateGovernanceAdditionalInfo = (props: { proposal: Proposal, newGovernance: Governance }) => {
    return <GovernanceInfo governance={props.newGovernance} title={"New Governance:"}/>
}

const ProposalCallCanisterAdditionalInfo = (props: { proposal: Proposal, task: CallCanister }) => {
    const {proposal, task} = props;
    const governanceDataContext = useGovernanceDataContext();
    const taskInfo = <div>
        <h3>Call Canister task</h3>
        <Descriptions bordered column={1} size={"small"}>
            <Descriptions.Item label={"Canister ID"}><CopyablePrincipalComponent principal={task.canister_id.toText()}/></Descriptions.Item>
            <Descriptions.Item label={"Method"}>{task.method}</Descriptions.Item>
            <Descriptions.Item label={"Argument Candid"}>{task.argument_candid}</Descriptions.Item>
            <Descriptions.Item label={"Canister Candid"}><Input.TextArea value={task.canister_did} size={"small"} readOnly rows={_.isEmpty(task.canister_did) ? 3 : 7} style={{width: 700}}/></Descriptions.Item>
        </Descriptions>
    </div>

    const taskResultInfo: React.ReactNode = useCustomCompareMemo(() => {
        if (hasOwnProperty(proposal.state, "Performed")) {
            const {result} = proposal.state.Performed;
            if (hasOwnProperty(result, "CallResponse")) {
                const {candid, error, response} = result.CallResponse
                const candidText: string = getICOptional(candid) || ""
                const errorText: string = getICOptional(error) || ""
                const responseText: string = toHexString(response)
                return <div>
                    <h3>Call Canister task result</h3>
                    <Descriptions bordered column={1} size={"small"}>
                        <Descriptions.Item label={"Candid"}><Typography.Paragraph>
                            <pre style={{fontSize: "0.8em"}}>{candidText}</pre>
                        </Typography.Paragraph></Descriptions.Item>
                        <Descriptions.Item label={"Error"}><span style={{color: COLOR_DANGER_HEX}}>{errorText}</span></Descriptions.Item>
                        <Descriptions.Item label={"Response"}><Typography.Text copyable={{text: responseText}}>{truncateMiddle(responseText, 50)}</Typography.Text></Descriptions.Item>
                    </Descriptions>
                </div>
            } else if (hasOwnProperty(result, "Error")) {
                const {reason} = result.Error;
                return <div>
                    <h3>Call Canister task result</h3>
                    <Descriptions bordered column={1} size={"small"}>
                        <Descriptions.Item label={"Error"}><span style={{color: COLOR_DANGER_HEX}}>{reason}</span></Descriptions.Item>
                    </Descriptions>
                </div>
            }
        }
        return null
    }, [proposal, task], _.isEqual)

    const votingConfigurationCallCanister = governanceDataContext.getGovernanceVotingConfigurationByProposalType("CallCanister");
    const votingConfig = votingConfigurationCallCanister != undefined ? <div>
        <h3>Voting Config</h3>
        <Descriptions bordered column={1} size={"small"}>
            <Descriptions.Item label={"CallCanister"}>stop_vote_count: {votingConfigurationCallCanister.stop_vote_count} / positive_vote_count: {votingConfigurationCallCanister.positive_vote_count}</Descriptions.Item>
        </Descriptions>
    </div> : null
    return <Space direction={"vertical"}>
        {votingConfig}
        {taskInfo}
        {taskResultInfo}
    </Space>
}

const ProposalVotingInfoAndControls = (props: { proposal: Proposal }) => {
    const {proposal} = props;
    return <Space direction={"vertical"}>
        {proposal.voting.votes.length == 0 ? <div>No votes</div> : null}
        {proposal.voting.votes.map((vote: Vote, idx) => {
            return <Descriptions bordered column={1} size={"small"} key={idx}>
                <Descriptions.Item label={"Vote #" + (idx + 1)}>
                    <Space direction={"horizontal"}>
                        <Tag>{vote.vote ? "Yes" : "No"}</Tag>
                        <span>{formatDate(Number(vote.vote_time), "dayTimeSeconds")}</span>
                        <CopyablePrincipalComponent principal={vote.participant.toText()} truncateLength={100}/>
                    </Space>
                </Descriptions.Item>
            </Descriptions>
        })}
        <OurVoteControls proposal={proposal}/>
        <OurPerformControls proposal={proposal}/>
    </Space>
}