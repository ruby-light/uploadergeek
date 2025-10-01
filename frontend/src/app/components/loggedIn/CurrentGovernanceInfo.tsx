import {isNullish} from '@dfinity/utils';
import {useGovernanceDataContext} from '../data/GovernanceDataProvider';
import {GovernanceInfo} from './GovernanceInfo';

export const CurrentGovernanceInfo = () => {
    const {governance} = useGovernanceDataContext();
    if (isNullish(governance)) {
        return null;
    }
    return <GovernanceInfo governance={governance} title="Current Governance:" />;
};
