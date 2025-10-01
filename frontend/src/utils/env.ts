export const IS_DEBUG_ENABLED = import.meta.env.MODE != 'production';
export const IS_DEV_ENVIRONMENT = import.meta.env.MODE == 'development';

export const INTERNET_IDENTITY_URL = process.env.INTERNET_IDENTITY_URL || 'https://identity.internetcomputer.org';

//TODO remove after testing
if (IS_DEBUG_ENABLED) {
    console.log('import.meta', import.meta);
    console.log('process.env', process.env);
    console.log('ui.env', {
        IS_DEBUG_ENABLED,
        IS_DEV_ENVIRONMENT
    });
}
