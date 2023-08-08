import * as React from "react";
import {PropsWithChildren, useEffect} from "react";
import {useGovernanceDataContext} from "src/components/data/GovernanceDataProvider";
import {Spin} from "antd";

export const CurrentGovernanceProvider = (props: PropsWithChildren<any>) => {
    const governanceDataContext = useGovernanceDataContext();

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        governanceDataContext.fetchGovernance()
    }, [governanceDataContext.fetchGovernance]);

    if (!governanceDataContext.governance.status.loaded) {
        return <Spin/>
    }
    return <>{props.children}</>
}