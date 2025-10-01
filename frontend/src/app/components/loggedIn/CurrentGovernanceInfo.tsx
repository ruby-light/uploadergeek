import {isNullish} from '@dfinity/utils';
import {useGovernanceContext} from '../../../context/governance/GovernanceProvider';
import {GovernanceInfo} from './GovernanceInfo';

export const CurrentGovernanceInfo = () => {
    const {governance} = useGovernanceContext();
    if (isNullish(governance)) {
        return null;
    }
    return <GovernanceInfo governance={governance} title="Current Governance:" />;
};
