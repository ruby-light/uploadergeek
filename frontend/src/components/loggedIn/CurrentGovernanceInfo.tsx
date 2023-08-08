import * as React from "react";
import {useGovernanceDataContext} from "src/components/data/GovernanceDataProvider";
import {GovernanceInfo} from "src/components/loggedIn/GovernanceInfo";

type Props = {}

export const CurrentGovernanceInfo = (props: Props) => {
    const governanceDataContext = useGovernanceDataContext();
    const governance = governanceDataContext.governance.data?.governance;
    if (!governance) {
        return null;
    }
    return <GovernanceInfo governance={governance} title={"Current Governance:"}/>
}