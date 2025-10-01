import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useMyGovernanceParticipantContext} from 'frontend/src/context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {useEffect} from 'react';

export const MyGovernanceParticipantPreloader = () => {
    const {isAuthenticated} = useAuthContext();
    const {fetchMyGovernanceParticipant} = useMyGovernanceParticipantContext();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        fetchMyGovernanceParticipant();
    }, [fetchMyGovernanceParticipant, isAuthenticated]);

    return null;
};
