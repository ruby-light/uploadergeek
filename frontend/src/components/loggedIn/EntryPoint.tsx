import * as React from "react";
import {Home} from "src/components/loggedIn/Home";
import {Redirect, Route, Switch} from "react-router-dom";
import {ProposalEntryPoint} from "src/components/loggedIn/proposal/ProposalEntryPoint";

type Props = {}

export const EntryPoint = (props: Props) => {
    return <div style={{paddingBottom: 30}}>
        <Switch>
            <Route path={"/"} exact component={Home}/>
            <Route path={"/proposal/:proposalId"} exact component={ProposalEntryPoint}/>
            <Redirect to={"/"}/>
        </Switch>
    </div>
}