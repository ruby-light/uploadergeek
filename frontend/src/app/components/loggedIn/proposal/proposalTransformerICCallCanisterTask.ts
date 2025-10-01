import type {CallCanister} from 'src/declarations/governance/governance.did';
import type {FormValuesType} from '../addProposalModal/AddProposalCallCanisterModalComponent';

/**
 * Method to transform UpgradeCanister task to a form values object
 * @param {CallCanister} task
 * @param {string | undefined} description
 * @returns {FormValuesType}
 */
export const transformCallCanisterTaskToFormValues = (task: CallCanister, description: string | undefined): FormValuesType => {
    return {
        methodName: task.method,
        canisterDid: task.canister_did.toString(),
        canisterId: task.canister_id.toString(),
        argumentCandid: task.argument_candid,
        description: description ?? ''
    };
};
