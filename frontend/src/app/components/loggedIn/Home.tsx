import {Divider, Space} from 'antd';
import {useMyGovernanceParticipantContextSafe} from '../../../context/governance/myGovernanceParticipant/MyGovernanceParticipantProvider';
import {CurrentGovernanceInfo} from './CurrentGovernanceInfo';
import {ParticipantPermissionTable} from './ParticipantPermissionTable';
import {ProposalsSection} from './ProposalsSection';
import {Toolbar} from './Toolbar';

export const Home = () => {
    const {myGovernanceParticipant} = useMyGovernanceParticipantContextSafe();

    return (
        <>
            <Space direction="vertical" style={{width: '100%'}} split={<Divider />}>
                <Toolbar />
                <ParticipantPermissionTable proposalPermissions={myGovernanceParticipant.proposal_permissions} />
                <CurrentGovernanceInfo />
                <ProposalsSection />
            </Space>
        </>
    );
};
