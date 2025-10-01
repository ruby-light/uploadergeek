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
        yes: 'Yes',
        no: 'No'
    }
};

export const i18 = wrapWithPrefix(rawI18);
