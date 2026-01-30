import {generatePath} from 'react-router-dom';

export const PATH_HOME = '/';
export const PATH_GOVERNANCE = '/governance';
export const PATH_PROFILE = '/profile';
export const PATH_PROPOSAL = '/proposal/:proposalId';
export const PATH_TOOLS = '/tools';

export const RouterPaths = {
    proposal: (proposalId: string) => generatePath(PATH_PROPOSAL, {proposalId})
};
