import {Navigate, Route, Routes} from 'react-router-dom';
import {Home} from './Home';
import {ProposalEntryPoint} from './proposal/ProposalEntryPoint';

export const EntryPoint = () => {
    return (
        <div style={{paddingBottom: 30}}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/proposal/:proposalId" element={<ProposalEntryPoint />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
};
