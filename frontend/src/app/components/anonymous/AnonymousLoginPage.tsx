import {Button} from 'antd';
import {SkeletonToolbarEntryPoint} from 'frontend/src/components/pages/skeleton/SkeletonToolbarEntryPoint';
import {ErrorBoundaryComponent} from 'frontend/src/components/widgets/ErrorBoundaryComponent';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {sendLoginNotification} from 'frontend/src/context/LoginNotificationHandler';

export const AnonymousLoginPage = () => {
    const {isAuthenticated, isAuthenticating} = useAuthContext();
    return (
        <>
            <div className="skToolbarRow">
                <ErrorBoundaryComponent childComponentName="Toolbar">
                    <SkeletonToolbarEntryPoint />
                </ErrorBoundaryComponent>
            </div>
            <div className="skContentRow">
                <div className="skContent">
                    <div>
                        <Button onClick={sendLoginNotification} type="primary" disabled={isAuthenticated || isAuthenticating} loading={isAuthenticating}>
                            Connect with Internet Identity
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
