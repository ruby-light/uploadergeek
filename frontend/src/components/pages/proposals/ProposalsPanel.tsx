import {PlusOutlined, ReloadOutlined} from '@ant-design/icons';
import {Button, Flex} from 'antd';
import {AddProposalCallCanisterModalButton} from 'frontend/src/app/components/loggedIn/addProposalModal/AddProposalCallCanisterModalButton';
import {AddProposalUpdateGovernanceModalButton} from 'frontend/src/app/components/loggedIn/addProposalModal/AddProposalUpdateGovernanceModalButton';
import {AddProposalUpgradeCanisterModalButton} from 'frontend/src/app/components/loggedIn/addProposalModal/AddProposalUpgradeCanisterModalButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useProposalsProviderContext} from 'frontend/src/context/governance/proposals/ProposalsProvider';
import {ProposalsTable} from './ProposalsTable';

export const ProposalsPanel = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title="Proposals" />
                    <RefreshButton />
                </Flex>
                <Flex wrap gap={8}>
                    <AddProposalUpdateGovernanceModalButton label="Update Governance" icon={<PlusOutlined />} />
                    <AddProposalUpgradeCanisterModalButton label="Upgrade Canister" icon={<PlusOutlined />} />
                    <AddProposalCallCanisterModalButton label="Call Canister" icon={<PlusOutlined />} />
                </Flex>
                <ProposalsTable />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchRemoteData} = useProposalsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <Button onClick={() => fetchRemoteData()} icon={<ReloadOutlined />} disabled={disabled} loading={inProgress} />;
};
