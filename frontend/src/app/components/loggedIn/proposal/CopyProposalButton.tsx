import {CopyOutlined} from '@ant-design/icons';
import {fromNullable} from '@dfinity/utils';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {CallCanister, Governance, Proposal, UpgradeCanister} from 'src/declarations/governance/governance.did';
import {AddProposalCallCanisterModalButton} from '../addProposalModal/AddProposalCallCanisterModalButton';
import {AddProposalUpdateGovernanceModalButton} from '../addProposalModal/AddProposalUpdateGovernanceModalButton';
import {AddProposalUpgradeCanisterModalButton} from '../addProposalModal/AddProposalUpgradeCanisterModalButton';
import {transformCallCanisterTaskToFormValues} from './proposalTransformerICCallCanisterTask';
import {transformICGovernanceToFormValues} from './proposalTransformerICGovernance';
import {transformUpgradeCanisterTaskToFormValues} from './proposalTransformerICUpgradeCanisterTask';

type Props = {
    proposal: Proposal;
};

export const CopyProposalButton = (props: Props) => {
    const {proposal} = props;

    if (hasProperty(proposal.detail, 'UpdateGovernance')) {
        return <CopyProposalUpdateGovernanceButton proposal={proposal} governance={proposal.detail.UpdateGovernance.new_governance} />;
    } else if (hasProperty(proposal.detail, 'UpgradeCanister')) {
        return <CopyProposalUpgradeCanisterButton proposal={proposal} task={proposal.detail.UpgradeCanister.task} />;
    } else if (hasProperty(proposal.detail, 'CallCanister')) {
        return <CopyProposalCallCanisterButton proposal={proposal} task={proposal.detail.CallCanister.task} />;
    }
    return null;
};

const CopyProposalUpdateGovernanceButton = (props: {proposal: Proposal; governance: Governance}) => {
    const {proposal} = props;
    const initialValues = transformICGovernanceToFormValues(props.governance, fromNullable(proposal.description));
    return (
        <>
            <AddProposalUpdateGovernanceModalButton label="Copy Proposal UpdateGovernance" initialValues={initialValues} icon={<CopyOutlined />} />
        </>
    );
};

const CopyProposalUpgradeCanisterButton = (props: {proposal: Proposal; task: UpgradeCanister}) => {
    const {proposal} = props;
    const initialValues = transformUpgradeCanisterTaskToFormValues(props.task, fromNullable(proposal.description));
    return (
        <>
            <AddProposalUpgradeCanisterModalButton label="Copy Proposal UpgradeCanister" initialValues={initialValues} icon={<CopyOutlined />} />
        </>
    );
};

const CopyProposalCallCanisterButton = (props: {proposal: Proposal; task: CallCanister}) => {
    const {proposal} = props;
    const initialValues = transformCallCanisterTaskToFormValues(props.task, fromNullable(proposal.description));
    return (
        <>
            <AddProposalCallCanisterModalButton label="Copy Proposal CallCanister" initialValues={initialValues} icon={<CopyOutlined />} />
        </>
    );
};
