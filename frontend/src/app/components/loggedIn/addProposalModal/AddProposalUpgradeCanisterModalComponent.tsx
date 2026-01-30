import {Principal} from '@dfinity/principal';
import {isEmptyString, nonNullish, toNullable} from '@dfinity/utils';
import {Button, Flex, Form, Input, Modal, Space} from 'antd';
import {useForm} from 'antd/lib/form/Form';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {REFRESH_PROPOSALS_TOPIC} from 'frontend/src/context/governance/proposals/ProposalsProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {i18} from 'frontend/src/i18';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {isCanisterPrincipalValid, isPrincipalValid} from 'frontend/src/utils/ic/principal';
import PubSub from 'pubsub-js';
import type {FieldData} from 'rc-field-form/lib/interface';
import type {Reducer} from 'react';
import {useReducer} from 'react';
import {useNavigate} from 'react-router-dom';
import type {AddNewProposalArgs, ProposalDetail} from 'src/declarations/governance/governance.did';
import type {ModalButtonProps, ModalProps} from '../../common/ModalCommon';

export type FormValuesType = {
    uploaderId: string;
    operatorId: string;
    canisterId: string;
    moduleHash: string;
    argumentCandid: string;
    description: string;
};

const defaultFormValues: FormValuesType = {
    uploaderId: '',
    operatorId: '',
    canisterId: '',
    moduleHash: '',
    argumentCandid: '',
    description: ''
};

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: false},
    cancel: {}
};

const title = `Create a new "Upgrade Canister" proposal`;

const okText = 'Create';
const errorText = 'Proposal cannot be created. Please try again later.';

interface Props extends ModalProps {
    initialValues?: FormValuesType;
}

export const AddProposalUpgradeCanisterModalComponent = (props: Props) => {
    const {initialValues} = props;
    const navigate = useNavigate();
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
            navigate(RouterPaths.proposal(response.Ok.proposal_id.toString()));
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
                    <Form.Item
                        label="Uploader Principal"
                        name="uploaderId"
                        rules={[
                            {
                                required: true,
                                validator: (_rule, value) => {
                                    if (isCanisterPrincipalValid(value)) {
                                        return Promise.resolve();
                                    } else {
                                        return Promise.reject('Invalid uploader principal');
                                    }
                                }
                            }
                        ]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Operator Principal"
                        name="operatorId"
                        rules={[
                            {
                                required: true,
                                validator: (_rule, value) => {
                                    if (isPrincipalValid(value)) {
                                        return Promise.resolve();
                                    } else {
                                        return Promise.reject('Invalid operator principal');
                                    }
                                }
                            }
                        ]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Canister Principal"
                        name="canisterId"
                        rules={[
                            {
                                required: true,
                                validator: (_rule, value) => {
                                    if (isCanisterPrincipalValid(value)) {
                                        return Promise.resolve();
                                    } else {
                                        return Promise.reject('Invalid canister principal');
                                    }
                                }
                            }
                        ]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Module Hash" name="moduleHash" rules={[{required: true, message: 'Invalid module hash'}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Argument Candid" name="argumentCandid" rules={[{required: true, message: 'Invalid argument candid'}]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Flex justify="end" gap={8}>
                        <Button type="default" onClick={props.onDestroy} disabled={modalButtonProps.ok.loading == true}>
                            {i18.common.button.cancelButton}
                        </Button>
                        <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>
                            {i18.common.button.submitButton}
                        </Button>
                    </Flex>
                </Space>
            </Form>
        </Modal>
    );
};

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    const proposalDetail: ProposalDetail = {
        UpgradeCanister: {
            task: {
                uploader_id: Principal.fromText(formValues.uploaderId),
                operator_id: Principal.fromText(formValues.operatorId),
                canister_id: Principal.fromText(formValues.canisterId),
                module_hash: formValues.moduleHash,
                argument_candid: formValues.argumentCandid
            }
        }
    };
    console.log('createProposalDetail result', proposalDetail);
    return proposalDetail;
};
