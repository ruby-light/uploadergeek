import {MinusCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Principal} from '@dfinity/principal';
import {isEmptyString, nonNullish, toNullable} from '@dfinity/utils';
import {Button, Card, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space} from 'antd';
import {useForm} from 'antd/lib/form/Form';
import {useICCanisterCallGovernance} from 'frontend/src/api/hub/useICCallGovernance';
import {REFRESH_PROPOSALS_TOPIC} from 'frontend/src/context/governance/proposals/ProposalsProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {isPrincipalValid} from 'frontend/src/utils/ic/principal';
import PubSub from 'pubsub-js';
import type {FieldData} from 'rc-field-form/lib/interface';
import type {Reducer} from 'react';
import {useReducer} from 'react';
import type {AddNewProposalArgs, GovernanceParticipant, ProposalDetail, ProposalPermission, ProposalType, VotingConfig} from 'src/declarations/governance/governance.did';
import type {ModalButtonProps, ModalProps} from '../../common/ModalCommon';

export type FormValuesTypeParticipantPermission = {
    proposalType: KeysOfUnion<ProposalType>;
    permissions: Array<KeysOfUnion<ProposalPermission>>;
};
export type FormValuesTypeParticipantPermissions = Array<FormValuesTypeParticipantPermission>;

export type FormValuesTypeParticipant = {
    principal: string;
    name: string;
    permissions: FormValuesTypeParticipantPermissions;
};

export type FormValuesTypeVotingConfigElement = {
    proposalType: KeysOfUnion<ProposalType>;
    numberOfVotes: number;
    numberOfVotesRequired: number;
};

export type FormValuesType = {
    participants: Array<FormValuesTypeParticipant>;
    votingConfiguration: Array<FormValuesTypeVotingConfigElement>;
    description: string;
};

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: true},
    cancel: {}
};

const defaultFormValues: FormValuesType = {
    participants: [],
    votingConfiguration: [],
    description: ''
};

interface Props extends ModalProps {
    initialValues?: FormValuesType;
}

export const AddProposalUpdateGovernanceModalComponent = (props: Props) => {
    const {initialValues} = props;
    const {call} = useICCanisterCallGovernance('addNewProposal');

    const [form] = useForm<FormValuesType>();
    const [modalButtonProps, setModalButtonProps] = useReducer<Reducer<ModalButtonProps, Partial<ModalButtonProps>>>((state, newState) => ({...state, ...newState}), modalButtonsPropsInitialValue);

    const formInitialValues: FormValuesType = {
        ...defaultFormValues,
        ...initialValues
    };

    const title = `Create a new "Update Governance" proposal`;

    const okText = 'Create';
    const errorText = 'Proposal cannot be created. Please try again later.';

    const asyncAdd = async (formValues: FormValuesType) => {
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
                form.setFields([{name: 'participants', errors: [localErrorText]}]);
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
            <Space direction="vertical" style={{width: '100%'}} size="middle">
                <Form form={form} layout="vertical" requiredMark={false} initialValues={formInitialValues} onFinish={onFormFinish} onFieldsChange={onFormFieldsChange} autoComplete="off">
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Form.List name={['votingConfiguration']}>
                                {(votingConfigFields, {add, remove}, {errors}) => (
                                    <Space direction="vertical" style={{width: '100%'}} size="small">
                                        {votingConfigFields.map((votingConfigField) => (
                                            <Space key={votingConfigField.key} align="baseline" wrap={true}>
                                                <Form.Item noStyle shouldUpdate={() => false}>
                                                    {() => (
                                                        <Form.Item
                                                            {...votingConfigField}
                                                            label="Proposal Type"
                                                            name={[votingConfigField.name, 'proposalType']}
                                                            rules={[{required: true, message: 'Invalid proposal type'}]}>
                                                            <Select style={{width: 200}}>
                                                                {(['UpdateGovernance', 'UpgradeCanister', 'CallCanister'] as Array<KeysOfUnion<ProposalType>>).map((item) => (
                                                                    <Select.Option key={item} value={item}>
                                                                        {item}
                                                                    </Select.Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    )}
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={() => false}>
                                                    {() => {
                                                        return (
                                                            <Form.Item
                                                                {...votingConfigField}
                                                                label="Number of Votes"
                                                                name={[votingConfigField.name, 'numberOfVotes']}
                                                                rules={[{required: true, message: 'Invalid number of votes'}]}>
                                                                <InputNumber />
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={() => false}>
                                                    {() => {
                                                        return (
                                                            <Form.Item
                                                                {...votingConfigField}
                                                                label="Positive Votes Required"
                                                                name={[votingConfigField.name, 'numberOfVotesRequired']}
                                                                rules={[{required: true, message: 'Invalid number of votes'}]}>
                                                                <InputNumber />
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                                <Form.Item label={' '}>
                                                    <>
                                                        <Button onClick={() => remove(votingConfigField.name)} icon={<MinusCircleOutlined />} type="link" />
                                                    </>
                                                </Form.Item>
                                            </Space>
                                        ))}
                                        <Form.Item style={{marginBottom: 0}}>
                                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                                                Add Voting Config
                                            </Button>
                                        </Form.Item>
                                        <Form.ErrorList errors={errors} />
                                    </Space>
                                )}
                            </Form.List>
                        </Col>
                        <Col span={24}>
                            <Form.List
                                name="participants"
                                rules={[
                                    {
                                        validator: async (_rule, value) => {
                                            if (value.length < 1) {
                                                return Promise.reject(new Error('Missing participants'));
                                            }
                                        }
                                    }
                                ]}>
                                {(participantsFields, {add, remove}, {errors}) => (
                                    <Space direction="vertical" style={{width: '100%'}} size="middle">
                                        {participantsFields.map((participantsField, participantIdx) => (
                                            <Card
                                                key={participantIdx}
                                                title={`Participant ${participantIdx + 1}`}
                                                extra={<Button onClick={() => remove(participantsField.name)} icon={<MinusCircleOutlined />} type="link" size="small" />}
                                                size="small">
                                                <Row gutter={[16, 8]}>
                                                    <Col span={18}>
                                                        <Form.Item noStyle shouldUpdate={() => false}>
                                                            {() => (
                                                                <Form.Item
                                                                    {...participantsField}
                                                                    label="Principal"
                                                                    name={[participantsField.name, 'principal']}
                                                                    rules={[
                                                                        {
                                                                            validator: async (_, principal) => {
                                                                                const principalValid = isPrincipalValid(principal);
                                                                                if (!principalValid) {
                                                                                    return Promise.reject(new Error('Invalid principal'));
                                                                                }
                                                                            }
                                                                        }
                                                                    ]}
                                                                    wrapperCol={{span: 24}}>
                                                                    <Input style={{width: '100%'}} />
                                                                </Form.Item>
                                                            )}
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item noStyle shouldUpdate={() => false}>
                                                            {() => (
                                                                <>
                                                                    <Form.Item
                                                                        {...participantsField}
                                                                        label="Name"
                                                                        name={[participantsField.name, 'name']}
                                                                        rules={[{required: true, message: 'Invalid name'}]}
                                                                        wrapperCol={{span: 24}}>
                                                                        <Input style={{width: '100%'}} />
                                                                    </Form.Item>
                                                                </>
                                                            )}
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.List name={[participantsField.name, 'permissions']}>
                                                            {(fields, {add, remove}, {errors}) => (
                                                                <Space direction="vertical" style={{width: '100%'}} size="small">
                                                                    {fields.map((proposalPermissionField) => (
                                                                        <Space key={proposalPermissionField.key} align="baseline" wrap={true}>
                                                                            <Form.Item noStyle shouldUpdate={() => false}>
                                                                                {() => (
                                                                                    <Form.Item
                                                                                        {...proposalPermissionField}
                                                                                        label="Proposal Type"
                                                                                        name={[proposalPermissionField.name, 'proposalType']}
                                                                                        rules={[{required: true, message: 'Invalid proposal type'}]}>
                                                                                        <Select style={{width: 200}}>
                                                                                            {(['UpdateGovernance', 'UpgradeCanister', 'CallCanister'] as Array<KeysOfUnion<ProposalType>>).map(
                                                                                                (item) => (
                                                                                                    <Select.Option key={item} value={item}>
                                                                                                        {item}
                                                                                                    </Select.Option>
                                                                                                )
                                                                                            )}
                                                                                        </Select>
                                                                                    </Form.Item>
                                                                                )}
                                                                            </Form.Item>
                                                                            <Form.Item noStyle shouldUpdate={() => false}>
                                                                                {() => {
                                                                                    return (
                                                                                        <Form.Item
                                                                                            {...proposalPermissionField}
                                                                                            label="Proposal Permissions"
                                                                                            name={[proposalPermissionField.name, 'permissions']}
                                                                                            rules={[{required: true, message: 'Invalid permissions'}]}>
                                                                                            <Select style={{width: 250}} mode="multiple">
                                                                                                {['Add', 'Vote', 'Perform'].map((item) => (
                                                                                                    <Select.Option key={item} value={item}>
                                                                                                        {item}
                                                                                                    </Select.Option>
                                                                                                ))}
                                                                                            </Select>
                                                                                        </Form.Item>
                                                                                    );
                                                                                }}
                                                                            </Form.Item>
                                                                            <Form.Item label={' '}>
                                                                                <>
                                                                                    <Button onClick={() => remove(proposalPermissionField.name)} icon={<MinusCircleOutlined />} type="link" />
                                                                                </>
                                                                            </Form.Item>
                                                                        </Space>
                                                                    ))}
                                                                    <Form.Item style={{marginBottom: 0}}>
                                                                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                                                                            Add Permission
                                                                        </Button>
                                                                    </Form.Item>
                                                                    <Form.ErrorList errors={errors} />
                                                                </Space>
                                                            )}
                                                        </Form.List>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add Participant
                                            </Button>
                                        </Form.Item>
                                        <Form.ErrorList errors={errors} />
                                    </Space>
                                )}
                            </Form.List>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Description" name="description">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Flex justify="end" gap={8}>
                                <Button type="default" onClick={props.onDestroy} disabled={modalButtonProps.ok.loading == true}>
                                    Cancel
                                </Button>
                                <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>
                                    Submit
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Form>
            </Space>
        </Modal>
    );
};

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    console.log('createProposalDetail', formValues);
    const participants: Array<[Principal, GovernanceParticipant]> = formValues.participants.map<[Principal, GovernanceParticipant]>((participant) => {
        const proposalPermissions: Array<[ProposalType, Array<ProposalPermission>]> = participant.permissions.map<[ProposalType, Array<ProposalPermission>]>((v) => {
            const proposalType: ProposalType = {[v.proposalType]: null} as ProposalType;
            const proposalPermissions: Array<ProposalPermission> = v.permissions.map((v) => ({[v]: null}) as ProposalPermission);
            return [proposalType, proposalPermissions];
        });
        const governanceParticipant: GovernanceParticipant = {
            proposal_permissions: proposalPermissions,
            name: participant.name
        };
        return [Principal.fromText(participant.principal), governanceParticipant];
    });
    const votingConfiguration: Array<[ProposalType, VotingConfig]> = formValues.votingConfiguration.map<[ProposalType, VotingConfig]>((v) => {
        const proposalType: ProposalType = {[v.proposalType]: null} as ProposalType;
        return [
            proposalType,
            {
                stop_vote_count: v.numberOfVotes,
                positive_vote_count: v.numberOfVotesRequired
            }
        ];
    });
    const proposalDetail: ProposalDetail = {
        UpdateGovernance: {
            new_governance: {
                participants: participants,
                voting_configuration: votingConfiguration
            }
        }
    };
    console.log('createProposalDetail result', proposalDetail);
    return proposalDetail;
};
