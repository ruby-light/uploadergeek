import {isNullish, nonNullish} from '@dfinity/utils';
import {Typography} from 'antd';
import {Home} from 'frontend/src/app/components/loggedIn/Home';
import {ProposalEntryPoint} from 'frontend/src/app/components/loggedIn/proposal/ProposalEntryPoint';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useGovernanceContext} from 'frontend/src/context/governance/GovernanceProvider';
import {useMyGovernanceParticipantContext} from 'frontend/src/context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {mergeClassName} from 'frontend/src/utils/core/dom/domUtils';
import type {PropsWithChildren, ReactNode} from 'react';
import {useMemo} from 'react';
import {Navigate, Route, Routes} from 'react-router';
import {ErrorAlertWithAction} from '../../widgets/alert/ErrorAlertWithAction';
import {WarningAlertWithAction} from '../../widgets/alert/WarningAlertWithAction';
import {ErrorBoundaryComponent} from '../../widgets/ErrorBoundaryComponent';
import {AbstractStubPage} from '../../widgets/stub/AbstractStubPage';
import {GovernancePage} from '../governance/GovernancePage';
import {ProfilePage} from '../profile/ProfilePage';
import {ToolsPage} from '../tools/ToolsPage';
import {PATH_GOVERNANCE, PATH_HOME, PATH_PROFILE, PATH_PROPOSAL, PATH_TOOLS} from './Router';

export const SkeletonContentEntryPoint = () => {
    return (
        <div className="skContent">
            <Routes>
                <Route
                    path={PATH_HOME}
                    element={
                        <RouteContentWrapper childComponentName="Home">
                            <Home />
                        </RouteContentWrapper>
                    }
                />
                <Route
                    path={PATH_GOVERNANCE}
                    element={
                        <RouteContentWrapper childComponentName="Home">
                            <GovernancePage />
                        </RouteContentWrapper>
                    }
                />
                <Route
                    path={PATH_PROFILE}
                    element={
                        <RouteContentWrapper childComponentName="Home">
                            <ProfilePage />
                        </RouteContentWrapper>
                    }
                />
                <Route
                    path={PATH_PROPOSAL}
                    element={
                        <RouteContentWrapper childComponentName="Proposal">
                            <ProposalEntryPoint />
                        </RouteContentWrapper>
                    }
                />

                <Route
                    path={PATH_TOOLS}
                    element={
                        <RouteContentWrapper childComponentName="Tools">
                            <ToolsPage />
                        </RouteContentWrapper>
                    }
                />
                <Route path="*" element={<Navigate to={PATH_HOME} />} />
            </Routes>
        </div>
    );
};

const RouteContentWrapper = (
    props: PropsWithChildren<{
        childComponentName: string;
        additionalClassName?: string;
    }>
) => {
    const {childComponentName, additionalClassName} = props;

    const className: string | undefined = useMemo(() => mergeClassName('commonEntryPoint', additionalClassName), [additionalClassName]);

    const {principal} = useAuthContext();
    const {myGovernanceParticipant, feature: myGovernanceParticipantFeature, responseError} = useMyGovernanceParticipantContext();
    const {feature: governanceFeature} = useGovernanceContext();

    let child: ReactNode = null;

    if (!myGovernanceParticipantFeature.status.loaded || !governanceFeature.status.loaded) {
        // child = <PanelLoadingComponent />;
        child = <AbstractStubPage title="Loading governance information..." icon="loading" />;
    }

    /**
    ==========================================
    My Governance Participant
    ==========================================
    */
    if (isNullish(child) && myGovernanceParticipantFeature.error.isError) {
        child = <ErrorAlertWithAction message={`Unable to load participant: ${myGovernanceParticipantFeature.error.error?.message}`} />;
    }

    if (isNullish(child) && (nonNullish(responseError) || isNullish(myGovernanceParticipant))) {
        child = (
            <WarningAlertWithAction
                message={
                    <div>
                        You are not registered as a governance participant.
                        <br />
                        Your principal is <Typography.Text copyable>{principal?.toString()}</Typography.Text>
                    </div>
                }
            />
        );
    }

    /**
    ==========================================
    Governance
    ==========================================
    */

    if (isNullish(child) && governanceFeature.error.isError) {
        child = <ErrorAlertWithAction message={`Unable to load governance: ${governanceFeature.error.error?.message}`} />;
    }

    if (isNullish(child)) {
        child = props.children;
    }

    return (
        <ErrorBoundaryComponent childComponentName={childComponentName}>
            <div className={className}>{child}</div>
        </ErrorBoundaryComponent>
    );
};
