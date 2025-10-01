import {wrapWithPrefix} from './utils/core/i18/prefix';

const rawI18 = {
    common: {
        button: {
            cancelButton: 'Cancel',
            closeButton: 'Close',
            confirmButton: 'Confirm',
            backButton: 'Back',
            retryButton: 'Retry',
            refreshButton: 'Refresh',
            howToDoIt: 'How to do it?'
        },
        error: {
            unableTo: 'Something went wrong.',
            processingError: 'Something went wrong. Retrying automatically...',
            certificateExpirationImminent: 'Certificate is about to expire',
            inputInvalidAccount: 'Account is not valid',
            inputInvalidPrincipal: 'Principal is not valid',
            priceTooLow: 'Price too low.',
            insufficientBalance: 'Insufficient balance',
            keyValueFailedToLoad: 'Failed to load'
        },
        vote: {
            approve: 'Approve',
            decline: 'Decline'
        }
    },
    auth: {
        disconnect: {
            confirmationModal: {
                title: 'Disconnect',
                description: 'Do you want to disconnect?',
                button: 'Disconnect'
            },
            button: 'Disconnect'
        }
    },
    toolbar: {
        title: 'GeekFactory Governance',
        menu: {
            home: 'Home',
            governance: 'Governance',
            profile: 'Profile',
            darkMode: 'Dark Mode'
        }
    }
};

export const i18 = wrapWithPrefix(rawI18);
