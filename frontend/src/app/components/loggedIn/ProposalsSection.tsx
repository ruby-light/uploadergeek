import {PlusOutlined} from '@ant-design/icons';
import {Space} from 'antd';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {apiLogger} from 'frontend/src/context/logger/logger';
import PubSub from 'pubsub-js';
import {useCallback, useEffect} from 'react';
import {AddProposalCallCanisterModalButton} from './addProposalModal/AddProposalCallCanisterModalButton';
import {AddProposalUpdateGovernanceModalButton} from './addProposalModal/AddProposalUpdateGovernanceModalButton';
import {AddProposalUpgradeCanisterModalButton} from './addProposalModal/AddProposalUpgradeCanisterModalButton';
import {ProposalsTable} from './ProposalsTable';

export const REFRESH_PROPOSALS_TOPIC = 'REFRESH_PROPOSALS_TOPIC';

export const ProposalsSection = () => {
    const {call, data: proposals} = useICCanisterCallGovernance('getProposals');

    const fetchProposals = useCallback(async () => {
        await call([{start: 0n, count: 100n, ascending: false}], {logger: apiLogger, logMessagePrefix: 'getProposals:'});
    }, [call]);

    useEffect(() => {
        const token = PubSub.subscribe(REFRESH_PROPOSALS_TOPIC, () => {
            fetchProposals();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchProposals]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    return (
        <Space direction="vertical" size="small">
            <h2>Proposals:</h2>
            <Space direction="horizontal">
                <AddProposalUpdateGovernanceModalButton label="Add UpdateGovernance Proposal" icon={<PlusOutlined />} />
                <AddProposalUpgradeCanisterModalButton label="Add UpgradeCanister Proposal" icon={<PlusOutlined />} />
                <AddProposalCallCanisterModalButton label="Add CallCanister Proposal" icon={<PlusOutlined />} />
            </Space>
            <ProposalsTable proposals={proposals?.proposals} />
        </Space>
    );
};
