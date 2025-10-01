import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import PubSub from 'pubsub-js';
import type {PropsWithChildren} from 'react';
import {useEffect} from 'react';
import {useGovernanceDataContext} from '../data/GovernanceDataProvider';

export const FETCH_CURRENT_GOVERNANCE_NOTIFICATION = 'FETCH_CURRENT_GOVERNANCE_NOTIFICATION';

export const CurrentGovernanceProvider = (props: PropsWithChildren<any>) => {
    const {fetchGovernance, feature} = useGovernanceDataContext();

    useEffect(() => {
        fetchGovernance();
    }, [fetchGovernance]);

    useEffect(() => {
        const token = PubSub.subscribe(FETCH_CURRENT_GOVERNANCE_NOTIFICATION, () => {
            // noinspection JSIgnoredPromiseFromCall
            fetchGovernance();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchGovernance]);

    if (!feature.status.loaded) {
        return <PanelLoadingComponent />;
    }
    return <>{props.children}</>;
};
