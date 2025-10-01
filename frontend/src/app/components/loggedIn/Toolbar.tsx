import {isNullish} from '@dfinity/utils';
import {Space} from 'antd';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {Link} from 'react-router-dom';
import {useMyGovernanceParticipantContextSafe} from '../../../context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {LogoutButton} from './LogoutButton';

export const Toolbar = () => {
    const {myGovernanceParticipant} = useMyGovernanceParticipantContextSafe();
    const {principal: currentPrincipal} = useAuthContext();
    const currentPrincipalComponent = isNullish(currentPrincipal) ? null : <CopyableUIDComponent uid={currentPrincipal.toText()} />;

    return (
        <Space direction="vertical" size={0}>
            <Link to="/">Go Home</Link>
            <h3 style={{margin: 0}}>
                User Name: {myGovernanceParticipant.name} <LogoutButton />
            </h3>
            {currentPrincipalComponent}
        </Space>
    );
};
