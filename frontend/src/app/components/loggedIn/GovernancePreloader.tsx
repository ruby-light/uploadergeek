import {useEffect} from 'react';
import {useGovernanceContext} from '../../../context/governance/GovernanceProvider';

export const GovernancePreloader = () => {
    const {fetchGovernance} = useGovernanceContext();

    useEffect(() => {
        fetchGovernance();
    }, [fetchGovernance]);

    return null;
};
