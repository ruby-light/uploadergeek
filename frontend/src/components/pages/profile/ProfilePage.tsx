import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {ParticipantPermissions} from 'frontend/src/app/components/loggedIn/ParticipantPermissionTable';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useMyGovernanceParticipantContextSafe} from 'frontend/src/context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {KeyValueVertical} from '../../widgets/KeyValueVertical';
import {PanelCard} from '../../widgets/PanelCard';
import {PanelHeader} from '../../widgets/PanelHeader';
import {CopyableUIDComponent} from '../../widgets/uid/CopyableUIDComponent';

export const ProfilePage = () => {
    const {myGovernanceParticipant} = useMyGovernanceParticipantContextSafe();
    const {principal: currentPrincipal} = useAuthContext();
    const currentPrincipalComponent = isNullish(currentPrincipal) ? null : <CopyableUIDComponent uid={currentPrincipal.toText()} />;
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title="User Permissions" />
                <KeyValueVertical
                    label="Participant"
                    value={
                        <Flex vertical>
                            {currentPrincipalComponent}
                            <span>{myGovernanceParticipant.name}</span>
                        </Flex>
                    }
                />
                <ParticipantPermissions proposalPermissions={myGovernanceParticipant.proposal_permissions} />
            </Flex>
        </PanelCard>
    );
};
