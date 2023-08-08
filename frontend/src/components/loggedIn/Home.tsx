import * as React from "react";
import {ParticipantPermissionTable} from "src/components/loggedIn/ParticipantPermissionTable";
import {ProposalsSection} from "src/components/loggedIn/ProposalsSection";
import {Divider, Space} from "antd";
import {useCurrentParticipantContext} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {Toolbar} from "src/components/loggedIn/Toolbar";
import {GovernanceInfo} from "src/components/loggedIn/GovernanceInfo";
import {CurrentGovernanceInfo} from "src/components/loggedIn/CurrentGovernanceInfo";

type Props = {}

export const Home = (props: Props) => {
    const {participant} = useCurrentParticipantContext();

    return <>
        <Space direction={"vertical"} style={{width: "100%"}} split={<Divider/>}>
            <Toolbar/>
            <ParticipantPermissionTable proposalPermissions={participant.proposal_permissions}/>
            <CurrentGovernanceInfo/>
            <ProposalsSection/>
        </Space>
    </>
}