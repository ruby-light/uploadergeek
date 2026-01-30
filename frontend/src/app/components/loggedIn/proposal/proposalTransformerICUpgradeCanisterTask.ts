import type {UpgradeCanister} from 'src/declarations/governance/governance.did';
import type {FormValuesType} from '../addProposalModal/AddProposalUpgradeCanisterModalComponent';

/**
 * Method to transform UpgradeCanister task to a form values object
 * @param {UpgradeCanister} task
 * @param {string | undefined} description
 * @returns {FormValuesType}
 */
export const transformUpgradeCanisterTaskToFormValues = (task: UpgradeCanister, description: string | undefined): FormValuesType => {
    return {
        uploaderId: task.uploader_id.toString(),
        operatorId: task.operator_id.toString(),
        canisterId: task.canister_id.toString(),
        moduleHash: task.module_hash,
        argumentCandid: task.argument_candid,
        description: description ?? ''
    };
};
