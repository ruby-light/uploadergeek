import {ProposalsPanel} from 'frontend/src/components/pages/proposals/ProposalsPanel';
import {ProposalsProvider} from 'frontend/src/context/governance/proposals/ProposalsProvider';

export const Home = () => {
    return (
        <>
            <ProposalsProvider>
                <ProposalsPanel />
            </ProposalsProvider>
        </>
    );
};
