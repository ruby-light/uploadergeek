import {parseStringToNumber} from 'frontend/src/utils/core/number/transform';
import {Navigate, useMatch} from 'react-router-dom';
import {ProposalPage} from './ProposalPage';

export const ProposalEntryPoint = () => {
    const routeMatchIdentity = useMatch('/proposal/:proposalId');

    if (routeMatchIdentity === null) {
        return <Navigate to="/" />;
    }

    const proposalIdNumber: number | undefined = routeMatchIdentity.params.proposalId ? parseStringToNumber(routeMatchIdentity.params.proposalId) : undefined;
    if (proposalIdNumber == undefined) {
        return <Navigate to="/" />;
    }

    return (
        <>
            <ProposalPage proposalId={proposalIdNumber} />
        </>
    );
};
