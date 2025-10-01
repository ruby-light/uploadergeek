import PubSub from 'pubsub-js';
import {useCallback, useEffect} from 'react';
import {SESSION_TIME_TO_LIVE_MILLIS} from '../constants';
import {NANOS_PER_MILLI} from '../utils/core/date/constants';
import {INTERNET_IDENTITY_URL} from '../utils/env';
import {useAuthContext} from './auth/AuthProvider';
import {applicationLogger} from './logger/logger';
import {caughtErrorMessage} from './logger/loggerConstants';

const AUTH_LOGIN_IN_NOTIFICATION = 'AUTH_LOGIN_IN_NOTIFICATION';

const maxTimeToLiveNanos = BigInt(SESSION_TIME_TO_LIVE_MILLIS * NANOS_PER_MILLI);

export const LoginNotificationHandler = () => {
    const {isAuthenticated, isAuthenticating, login} = useAuthContext();

    const tryToLogin = useCallback(async () => {
        try {
            if (isAuthenticated || isAuthenticating) {
                /**
                 * skip
                 */
                return;
            }
            await login({
                identityProvider: INTERNET_IDENTITY_URL,
                maxTimeToLive: maxTimeToLiveNanos,
                allowPinAuthentication: false
            });
        } catch (e) {
            applicationLogger.error(caughtErrorMessage('LoginNotificationHandler:'), e);
        }
    }, [isAuthenticated, isAuthenticating, login]);

    useEffect(() => {
        const token = PubSub.subscribe(AUTH_LOGIN_IN_NOTIFICATION, () => {
            tryToLogin();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [tryToLogin]);

    return null;
};

export const sendLoginNotification = () => {
    PubSub.publish(AUTH_LOGIN_IN_NOTIFICATION);
};
