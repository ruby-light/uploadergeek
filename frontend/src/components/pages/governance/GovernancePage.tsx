import {isNullish} from '@dfinity/utils';
import {GovernanceInfo} from 'frontend/src/app/components/loggedIn/GovernanceInfo';
import {useGovernanceContext} from 'frontend/src/context/governance/GovernanceProvider';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {ErrorAlert} from '../../widgets/alert/ErrorAlert';

export const GovernancePage = () => {
    const {governance} = useGovernanceContext();
    if (isNullish(governance)) {
        applicationLogger.log('GovernancePage: governance is nullish');
        return <ErrorAlert message="Unable to load governance information." />;
    }
    return <GovernanceInfo governance={governance} title="Current Governance Configuration" />;
};
