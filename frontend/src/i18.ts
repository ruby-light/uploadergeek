import {wrapWithPrefix} from './utils/core/i18/prefix';

const rawI18 = {
    common: {
        button: {
            cancelButton: 'Cancel',
            submitButton: 'Submit',
            retryButton: 'Retry'
        },
        error: {
            unableTo: 'Something went wrong.'
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
