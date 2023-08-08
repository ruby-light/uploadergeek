import * as React from "react";
import _ from "lodash"
import {useCurrentParticipantContext} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {Button, Space} from "antd";
import {LogoutButton} from "src/components/loggedIn/LogoutButton";
import {useAuthProviderContext} from "geekfactory-ic-js-auth";
import {CopyablePrincipalComponent} from "src/components/common/CopyablePrincipalComponent";
import {Link} from "react-router-dom";

type Props = {}

export const Toolbar = (props: Props) => {
    const {participant} = useCurrentParticipantContext();

    const authProviderContext = useAuthProviderContext();
    const currentPrincipal = authProviderContext.getCurrentPrincipal()?.toText() || ""
    const currentPrincipalComponent = _.isEmpty(currentPrincipal) ? null : <CopyablePrincipalComponent principal={currentPrincipal} truncateLength={100}/>

    return <Space direction={"vertical"} size={0}>
        <Link to={"/"}>Go Home</Link>
        <h1 style={{margin: 0}}>User Name: {participant.name} <LogoutButton/></h1>
        {currentPrincipalComponent}
    </Space>
}