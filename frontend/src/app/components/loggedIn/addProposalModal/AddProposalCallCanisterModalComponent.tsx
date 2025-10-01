import {Principal} from '@dfinity/principal';
import {isEmptyString, nonNullish, toNullable} from '@dfinity/utils';
import {Button, Flex, Form, Input, Modal, Space} from 'antd';
import {useForm} from 'antd/lib/form/Form';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {REFRESH_PROPOSALS_TOPIC} from 'frontend/src/context/governance/proposals/ProposalsProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {isCanisterPrincipalValid} from 'frontend/src/utils/ic/principal';
import PubSub from 'pubsub-js';
import {type FieldData} from 'rc-field-form/lib/interface';
import type {Reducer} from 'react';
import {useReducer} from 'react';
import type {AddNewProposalArgs, ProposalDetail} from 'src/declarations/governance/governance.did';
import type {ModalButtonProps, ModalProps} from '../../common/ModalCommon';

export type FormValuesType = {
    methodName: string;
    canisterDid: string;
    canisterId: string;
    argumentCandid: string;
    description: string;
};

const defaultFormValues: FormValuesType = {
    methodName: '',
    canisterDid: '',
    canisterId: '',
    argumentCandid: '',
    description: ''
};

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: false},
    cancel: {}
};

const title = `Create a new "Call Canister" proposal`;

const okText = 'Create';
const errorText = 'Proposal cannot be created. Please try again later.';

interface Props extends ModalProps {
    initialValues?: FormValuesType;
}

export const AddProposalCallCanisterModalComponent = (props: Props) => {
    const {initialValues} = props;

    const {call} = useICCanisterCallGovernance('addNewProposal');

    const formInitialValues: FormValuesType = {
        ...defaultFormValues,
        ...initialValues
    };

    const [form] = useForm<FormValuesType>();
    const [modalButtonProps, setModalButtonProps] = useReducer<Reducer<ModalButtonProps, Partial<ModalButtonProps>>>((state, newState) => ({...state, ...newState}), modalButtonsPropsInitialValue);

    const asyncAdd = async (formValues: FormValuesType) => {
        console.log('onCreateProposal: formValues', formValues);
        const {description} = formValues;
        const proposalDetail = createProposalDetail(formValues);

        if (proposalDetail == undefined) {
            return;
        }

        const requestArgs: AddNewProposalArgs = {
            description: toNullable(isEmptyString(description) ? undefined : description),
            proposal_detail: proposalDetail
        };

        const response = await call([requestArgs], {
            logger: apiLogger,
            logMessagePrefix: 'addNewProposal:',
            onBeforeRequest: async () => {
                //disabled buttons
                setModalButtonProps({
                    ok: {disabled: true, loading: true},
                    cancel: {disabled: true}
                });
            }
        });

        if (hasProperty(response, 'Ok')) {
            PubSub.publish(REFRESH_PROPOSALS_TOPIC);
            props.onDestroy();
        } else if (hasProperty(response, 'Err')) {
            let localErrorText = errorText;
            if (hasProperty(response.Err, 'NotPermission')) {
                localErrorText = "You don't have permission to create a proposal.";
            } else if (hasProperty(response.Err, 'Validation')) {
                const validationErrorReason = response.Err.Validation.reason;
                localErrorText = `Proposal cannot be created. Reason: ${validationErrorReason}`;
            }
            //enabled buttons
            setModalButtonProps({
                ok: {disabled: false, loading: false},
                cancel: {disabled: false}
            });
            //update errors
            if (nonNullish(form)) {
                form.setFields([{name: 'description', errors: [localErrorText]}]);
            }
        } else {
            //enabled buttons
            setModalButtonProps({
                ok: {disabled: false, loading: false},
                cancel: {disabled: false}
            });
            //update errors
            if (nonNullish(form)) {
                form.setFields([{name: 'description', errors: [errorText]}]);
            }
        }
    };

    const onFormFieldsChange = (_changedFields: Array<FieldData>, allFields: Array<FieldData>) => {
        let valid = true;
        for (const idx in allFields) {
            const field = allFields[idx];
            if (field.errors && field.errors.length > 0) {
                valid = false;
            }
        }
        setModalButtonProps({
            ok: {disabled: !valid}
        });
    };

    const onFormFinish = async (values: FormValuesType) => {
        console.log('onFormFinish', values);
        await asyncAdd(values);
    };

    const onCancel = () => {
        props.onDestroy();
    };

    const onOk = async () => {
        if (form) {
            try {
                const values = await form.validateFields();
                await onFormFinish(values);
            } catch {}
        }
    };

    return (
        <Modal
            width={735}
            closable={false}
            maskClosable={false}
            destroyOnHidden={true}
            keyboard={false}
            open={props.visible}
            title={title}
            onCancel={onCancel}
            okText={okText}
            onOk={onOk}
            okButtonProps={modalButtonProps.ok}
            cancelButtonProps={modalButtonProps.cancel}
            footer={null}>
            <Form form={form} layout="vertical" requiredMark={true} initialValues={formInitialValues} onFinish={onFormFinish} onFieldsChange={onFormFieldsChange} autoComplete="off">
                <Space direction="vertical" style={{width: '100%'}} size="middle">
                    <Form.Item label="Method Name" name="methodName" rules={[{required: true, message: 'Invalid method name'}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Canister ID"
                        name="canisterId"
                        rules={[
                            {
                                required: true,
                                validator: (_rule, value) => {
                                    if (isCanisterPrincipalValid(value)) {
                                        return Promise.resolve();
                                    } else {
                                        return Promise.reject('Invalid canister ID');
                                    }
                                }
                            }
                        ]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Argument Candid" name="argumentCandid" rules={[{required: true, message: 'Invalid argument candid'}]}>
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item label="Canister DID" name="canisterDid" rules={[]}>
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea />
                    </Form.Item>
                    <Flex justify="end" gap={8}>
                        <Button type="default" onClick={props.onDestroy} disabled={modalButtonProps.ok.loading == true}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>
                            Submit
                        </Button>
                    </Flex>
                </Space>
            </Form>
        </Modal>
    );
};

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    const proposalDetail: ProposalDetail = {
        CallCanister: {
            task: {
                method: formValues.methodName,
                canister_id: Principal.fromText(formValues.canisterId),
                canister_did: toNullable(isEmptyString(formValues.canisterDid) ? undefined : formValues.canisterDid),
                argument_candid: formValues.argumentCandid,
                payment: toNullable()
            }
        }
    };
    console.log('createProposalDetail result', proposalDetail);
    return proposalDetail;
};
