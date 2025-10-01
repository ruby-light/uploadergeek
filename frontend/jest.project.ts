export default {
    displayName: 'frontend',
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {useESM: true}]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: '(\\.(test|spec))\\.(ts|tsx|js)$',
    rootDir: '.',
    setupFiles: ['<rootDir>/../jest.polyfill.js']
};
