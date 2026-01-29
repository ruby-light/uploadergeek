import {isNullish} from '@dfinity/utils';
import {type PropsWithChildren, useEffect} from 'react';
import {AnonymousLoginPage} from '../app/components/anonymous/AnonymousLoginPage';
import {GovernancePreloader} from '../app/components/loggedIn/GovernancePreloader';
import {AgentProvider} from '../context/agent/AgentProvider';
import {AppConfigProvider} from '../context/AppConfigProvider';
import {AuthProvider, useAuthContext} from '../context/auth/AuthProvider';
import {CanisterProvider} from '../context/canister/CanisterProvider';
import {CurrentCanisterIdProvider, useCurrentCanisterIdContext} from '../context/canisterId/CurrentCanisterIdProvider';
import {DelegationExpirationLogger} from '../context/DelegationExpirationLogger';
import {FaviconMonitor} from '../context/favicon/FaviconMonitor';
import {GovernanceProvider} from '../context/governance/GovernanceProvider';
import {MyGovernanceParticipantProvider} from '../context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {apiLogger, applicationLogger, authLogger} from '../context/logger/logger';
import {LoginNotificationHandler} from '../context/LoginNotificationHandler';
import {MediaThemeProvider} from '../context/mediaTheme/MediaThemeProvider';
import {useThemeTypeController} from '../context/mediaTheme/useMediaThemeTypeController';
import {IS_DEBUG_ENABLED} from '../utils/env';
import {MyGovernanceParticipantPreloader} from './pages/common/stub/MyGovernanceParticipantPreloader';
import {SkeletonContentEntryPoint} from './pages/skeleton/SkeletonContentEntryPoint';
import {SkeletonToolbarEntryPoint} from './pages/skeleton/SkeletonToolbarEntryPoint';
import {ErrorAlert} from './widgets/alert/ErrorAlert';
import {ErrorBoundaryComponent} from './widgets/ErrorBoundaryComponent';
import {PageLoaderComponent} from './widgets/PageLoaderComponent';

export const AppEntryPoint = () => {
    return (
        <MediaThemeWrapper>
            <AuthProvider logger={authLogger}>
                <AgentProviderWrapper>
                    <LoginNotificationHandler />
                    <DelegationExpirationLogger />
                    <DataComponents>
                        <AppRootLayout />
                    </DataComponents>
                </AgentProviderWrapper>
            </AuthProvider>
        </MediaThemeWrapper>
    );
};

const MediaThemeWrapper = (props: PropsWithChildren) => {
    const {type, setType} = useThemeTypeController('system');
    return (
        <MediaThemeProvider type={type} onTypeChange={setType} darkClassName="gf-dark">
            <FaviconMonitor lightIconFileName="/favicon-64.svg" darkIconFileName="/favicon-64-dark.svg" />
            <AppConfigProvider>{props.children}</AppConfigProvider>
        </MediaThemeProvider>
    );
};

const DataComponents = (props: PropsWithChildren) => {
    const {principal, isAuthenticated} = useAuthContext();
    const currentPrincipalText = principal?.toText() || 'anonymous';
    if (!isAuthenticated) {
        return <AnonymousLoginPage />;
    }
    return (
        <CurrentCanisterIdProvider>
            <CurrentCanisterIdPreloader>
                <MyGovernanceParticipantProvider key={currentPrincipalText}>
                    <MyGovernanceParticipantPreloader />
                    <GovernanceProvider>
                        <GovernancePreloader />
                        {props.children}
                    </GovernanceProvider>
                </MyGovernanceParticipantProvider>
            </CurrentCanisterIdPreloader>
        </CurrentCanisterIdProvider>
    );
};

const CurrentCanisterIdPreloader = (props: PropsWithChildren) => {
    const {currentCanisterId, feature} = useCurrentCanisterIdContext();

    if (!feature.status.loaded) {
        return <PageLoaderComponent />;
    }

    if (isNullish(currentCanisterId)) {
        return <ErrorAlert message="Unable to load canister information." />;
    }

    return props.children;
};

const AppRootLayout = () => {
    return (
        <>
            <div className="skToolbarRow">
                <ErrorBoundaryComponent childComponentName="Toolbar">
                    <SkeletonToolbarEntryPoint />
                </ErrorBoundaryComponent>
            </div>
            <div className="skContentRow">
                <ErrorBoundaryComponent childComponentName="Content">
                    <SkeletonContentEntryPoint />
                </ErrorBoundaryComponent>
            </div>
        </>
    );
};

const AgentProviderWrapper = (props: PropsWithChildren) => {
    const {isReady, principal, accountIdentifierHex} = useAuthContext();
    const currentPrincipalText = principal?.toText() || 'anonymous';
    useEffect(() => {
        if (isReady) {
            applicationLogger.log('Current principal', currentPrincipalText);
            if (accountIdentifierHex != undefined) {
                applicationLogger.log('Current principal main subaccount', accountIdentifierHex);
            }
        }
    }, [principal, currentPrincipalText, isReady, accountIdentifierHex]);

    if (!isReady) {
        return <PageLoaderComponent />;
    }

    return (
        <AgentProvider isDevelopment={IS_DEBUG_ENABLED}>
            <CanisterProvider logger={apiLogger}>{props.children}</CanisterProvider>
        </AgentProvider>
    );
};
