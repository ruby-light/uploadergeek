import {isNullish, nonNullish} from '@dfinity/utils';
import {Typography} from 'antd';
import {LogoutButton} from 'frontend/src/app/components/loggedIn/LogoutButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useMyGovernanceParticipantContext} from 'frontend/src/context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import type {PropsWithChildren} from 'react';

export const MyGovernanceParticipantPreloader = (props: PropsWithChildren) => {
    const {principal} = useAuthContext();
    const {myGovernanceParticipant, feature, responseError} = useMyGovernanceParticipantContext();

    const headerComponent = (
        <>
            <h1>
                Welcome <LogoutButton />
            </h1>
        </>
    );

    if (!feature.status.loaded) {
        return (
            <>
                {headerComponent}
                <PanelLoadingComponent />
            </>
        );
    }

    if (feature.error.isError) {
        return (
            <>
                {headerComponent}
                <ErrorAlertWithAction message={`Unable to load participant: ${feature.error.error?.message}`} />
            </>
        );
    }

    if (nonNullish(responseError) || isNullish(myGovernanceParticipant)) {
        return (
            <>
                {headerComponent}
                <div>
                    You are not registered as a governance participant.
                    <br />
                    Your principal is <Typography.Text copyable>{principal?.toString()}</Typography.Text>
                </div>
            </>
        );
    }

    return props.children;
};
