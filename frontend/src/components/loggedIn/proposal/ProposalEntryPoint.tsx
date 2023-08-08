import * as React from "react";
import {Redirect, useRouteMatch} from "react-router-dom";
import _ from "lodash"
import {ProposalPage} from "src/components/loggedIn/proposal/ProposalPage";

export const ProposalEntryPoint = () => {

    const routeMatchIdentity = useRouteMatch<{ proposalId: string }>("/proposal/:proposalId");

    if (routeMatchIdentity === null) {
        return <Redirect to={"/"}/>
    }

    const proposalIdNumber: number | undefined = routeMatchIdentity.params.proposalId ? _.toNumber(routeMatchIdentity.params.proposalId) : undefined
    if (proposalIdNumber == undefined || !_.isFinite(proposalIdNumber)) {
        return <Redirect to={"/"}/>
    }

    return <>
        <ProposalPage proposalId={proposalIdNumber}/>
    </>
}