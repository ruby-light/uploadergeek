import {type PropsWithChildren, useEffect} from 'react';
import {AnonymousLoginPage} from '../app/components/anonymous/AnonymousLoginPage';
import {GovernanceDataProvider} from '../app/components/data/GovernanceDataProvider';
import {CurrentGovernanceProvider} from '../app/components/loggedIn/CurrentGovernanceProvider';
import {EntryPoint} from '../app/components/loggedIn/EntryPoint';
import {AgentProvider} from '../context/agent/AgentProvider';
import {AuthProvider, useAuthContext} from '../context/auth/AuthProvider';
import {CanisterProvider} from '../context/canister/CanisterProvider';
import {DelegationExpirationLogger} from '../context/DelegationExpirationLogger';
import {MyGovernanceParticipantProvider} from '../context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {apiLogger, applicationLogger, authLogger} from '../context/logger/logger';
import {LoginNotificationHandler} from '../context/LoginNotificationHandler';
import {IS_DEBUG_ENABLED} from '../utils/env';
import {MyGovernanceParticipantPreloader} from './pages/common/stub/MyGovernanceParticipantPreloader';
import {PageLoaderComponent} from './widgets/PageLoaderComponent';

export const AppEntryPoint = () => {
    return (
        <AuthProvider logger={authLogger}>
            <AgentProviderWrapper>
                <LoginNotificationHandler />
                <DelegationExpirationLogger />
                <DataComponents>
                    <AppRootLayout />
                </DataComponents>
            </AgentProviderWrapper>
        </AuthProvider>
    );
};

const DataComponents = (props: PropsWithChildren) => {
    const {principal} = useAuthContext();
    const currentPrincipalText = principal?.toText() || 'anonymous';
    return <div key={currentPrincipalText}>{props.children}</div>;
};

const AppRootLayout = () => {
    const {isAuthenticated} = useAuthContext();
    if (isAuthenticated) {
        return (
            <MyGovernanceParticipantProvider>
                <MyGovernanceParticipantPreloader>
                    <GovernanceDataProvider>
                        <CurrentGovernanceProvider>
                            <EntryPoint />
                        </CurrentGovernanceProvider>
                    </GovernanceDataProvider>
                </MyGovernanceParticipantPreloader>
            </MyGovernanceParticipantProvider>
        );
    }
    applicationLogger.log('User is authenticated, rendering app layout');

    return <AnonymousLoginPage />;
};

const AgentProviderWrapper = ({children}: PropsWithChildren) => {
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
            <CanisterProvider logger={apiLogger}>{children}</CanisterProvider>
        </AgentProvider>
    );
};
