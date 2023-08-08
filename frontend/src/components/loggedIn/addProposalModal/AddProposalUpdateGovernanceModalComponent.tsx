import * as React from "react";
import {Reducer, useReducer} from "react";
import {FieldData, Rule} from "rc-field-form/lib/interface";
import {useForm} from "antd/lib/form/Form";
import {Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space} from "antd";
import {createICOptional, getICRequestErrName, isErr, isOk, isPrincipalValid} from "geekfactory-ic-js-util";
import {useHistory} from "react-router-dom";
import _ from "lodash"
import {delayPromise, GFError, hasOwnProperty, KeysOfUnion} from "geekfactory-js-util";
import {ModalButtonProps, ModalProps} from "src/components/common/ModalCommon";
import {useActorsContext} from "src/components/data/ActorsProvider";
import {AddNewProposalArgs, AddNewProposalError, AddNewProposalResponse, GovernanceParticipant, ProposalDetail, ProposalPermission, ProposalType, VotingConfig} from "declarations/governance/governance.did";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {ProposalTypeUI} from "src/components/loggedIn/addProposalModal/AddProposalModalButton";
import {Principal} from "@dfinity/principal";
import PubSub from "pubsub-js";
import {REFRESH_PROPOSALS_TOPIC} from "src/components/loggedIn/ProposalsSection";

export type ProposalPermissionUI = KeysOfUnion<ProposalPermission>

type FormValuesTypeParticipantPermission = {
    proposalType: ProposalTypeUI | ""
    permissions: Array<ProposalPermissionUI>
}
type FormValuesTypeParticipantPermissions = Array<FormValuesTypeParticipantPermission>

type FormValuesTypeParticipant = {
    principal: string
    name: string
    permissions: FormValuesTypeParticipantPermissions
}

type FormValuesTypeVotingConfigElement = {
    proposalType: ProposalTypeUI | ""
    numberOfVotes: number
    numberOfVotesRequired: number
}

type FormValuesType = {
    participants: Array<FormValuesTypeParticipant>
    votingConfiguration: Array<FormValuesTypeVotingConfigElement>
    description: string
}

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: true},
    cancel: {}
}

const defaultFormValues: FormValuesType = {
    participants: [{
        principal: "4yl5c-iixs5-wuyhi-bals2-ddskn-tlm3z-vdsy7-rcmsd-yfujt-f3i2g-7ae",
        name: "local II 10000",
        permissions: [{
            proposalType: "UpdateGovernance",
            permissions: ["Add", "Vote", "Perform"]
        }]
    },
        {
            principal: "myqmt-pj6bp-oenqu-pnjbc-qglgl-elokq-n54ms-gyyds-ao5hs-ldrvi-zqe",
            name: "local cmd",
            permissions: [{
                proposalType: "UpdateGovernance",
                permissions: ["Add", "Vote", "Perform"]
            }]
        }],
    votingConfiguration: [{
        proposalType: "UpdateGovernance",
        numberOfVotes: 2,
        numberOfVotesRequired: 1
    }],
    description: "My Description"
}

interface Props extends ModalProps {

}

export const AddProposalUpdateGovernanceModalComponent = (props: Props) => {
    const actorsContext = useActorsContext();
    const history = useHistory()

    const [form] = useForm<FormValuesType>()
    const [modalButtonProps, setModalButtonProps] = useReducer<Reducer<ModalButtonProps, Partial<ModalButtonProps>>>(
        (state, newState) => ({...state, ...newState}),
        modalButtonsPropsInitialValue
    )

    const initialValues: FormValuesType = {
        participants: defaultFormValues.participants,
        votingConfiguration: defaultFormValues.votingConfiguration,
        description: defaultFormValues.description
    }

    const title = `Create a new "Upgrade Governance" proposal`

    const okText = "Create"
    const errorText = "Proposal cannot be created. Please try again later."

    const asyncAdd = async (formValues: FormValuesType) => {
        try {
            const {description} = formValues

            const proposalDetail = createProposalDetail(formValues)

            // if (process.env.NODE_ENV === "development") {
            //     throw new Error("test error")
            // }

            if (proposalDetail == undefined) {
                return
            }

            const requestArgs: AddNewProposalArgs = {
                description: createICOptional(_.isEmpty(description) ? undefined : description),
                proposal_detail: proposalDetail,
            };

            if (!!process.env.IS_TEST_SERVER) {
                console.log("add_new_proposal requestArgs", requestArgs);
            }

            //disabled buttons
            setModalButtonProps({
                ok: {disabled: true, loading: true,},
                cancel: {disabled: true,}
            })

            const actor = await actorsContext.getGovernanceActor();
            if (actor) {
                if (process.env.NODE_ENV === "development") {
                    await delayPromise(1000)
                }
                const response: AddNewProposalResponse = await actor.add_new_proposal(requestArgs)
                if (!!process.env.IS_TEST_SERVER) {
                    console.log("add_new_proposal response", response)
                }
                if (isOk(response)) {
                    PubSub.publish(REFRESH_PROPOSALS_TOPIC)
                    props.onDestroy()
                    return
                } else if (isErr(response)) {
                    const errorName: KeysOfUnion<AddNewProposalError> = getICRequestErrName(response) as KeysOfUnion<AddNewProposalError>;
                    console.log("add_new_proposal errorName", errorName)
                    let localErrorText = errorText
                    if (hasOwnProperty(response.Err, "NotPermission")) {
                        localErrorText = "You don't have permission to create a proposal."
                    } else if (hasOwnProperty(response.Err, "Validation")) {
                        const validationErrorReason = response.Err.Validation.reason;
                        localErrorText = `Proposal cannot be created. Reason: ${validationErrorReason}`
                    }
                    //enabled buttons
                    setModalButtonProps({
                        ok: {disabled: false, loading: false,},
                        cancel: {disabled: false,}
                    })
                    //update errors
                    form && form.setFields([{name: "participants", errors: [localErrorText]}])
                }
            } else {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("noActor")
            }
        } catch (e) {
            const error: GFError = GFError.withUnknownError(e)
            console.error("add_new_proposal: error caught", error)
            //enabled buttons
            setModalButtonProps({
                ok: {disabled: false, loading: false,},
                cancel: {disabled: false,}
            })
            //update errors
            form && form.setFields([{name: "description", errors: [errorText]}])
        }
    }

    const onFormFieldsChange = (changedFields: FieldData[], allFields: FieldData[]) => {
        let valid = true;
        for (const idx in allFields) {
            const field = allFields[idx]
            if (field.errors && field.errors.length > 0) {
                valid = false;
            }
        }
        setModalButtonProps({
            ok: {disabled: !valid}
        })
    }

    const onFormFinish = async (values: FormValuesType) => {
        console.log("onFormFinish", values);
        await asyncAdd(values)
    }

    const onCancel = () => {
        props.onDestroy()
    }

    const onOk = async () => {
        if (form) {
            try {
                const values = await form.validateFields();
                await onFormFinish(values)
            } catch (info) {
                // console.log('Validate Failed:', info);
            }
        }
    }

    return <Modal width={735} closable={false} maskClosable={false} destroyOnClose={true}
                  open={props.visible} title={title} onCancel={onCancel} okText={okText} onOk={onOk}
                  okButtonProps={modalButtonProps.ok} cancelButtonProps={modalButtonProps.cancel} /*className={"ug-modal"}*/
                  footer={null}
    >
        <Space direction={"vertical"} style={{width: "100%"}} size={"middle"}>
            <Form form={form}
                  layout="vertical"
                  requiredMark={false}
                  initialValues={initialValues}
                  onFinish={onFormFinish}
                  onFieldsChange={onFormFieldsChange}
                  autoComplete={"off"}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Form.List name={["votingConfiguration"]}>
                            {(votingConfigFields, {add, remove}, {errors}) => (
                                <Space direction={"vertical"} style={{width: "100%"}} size={"small"}>
                                    {votingConfigFields.map(votingConfigField => (
                                        <Space key={votingConfigField.key} align="baseline" wrap={true}>
                                            <Form.Item noStyle shouldUpdate={() => false}>
                                                {() => (
                                                    <Form.Item {...votingConfigField}
                                                               label="Proposal Type"
                                                               name={[votingConfigField.name, 'proposalType']}
                                                               rules={[
                                                                   {required: true, message: 'Missing proposalType'},
                                                               ]}>
                                                        <Select style={{width: 200}}>
                                                            {(["UpdateGovernance", "UpgradeCanister", "CallCanister"] as Array<ProposalTypeUI>).map(item => (
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
                                                        <Form.Item {...votingConfigField}
                                                                   label="Number of Votes"
                                                                   name={[votingConfigField.name, 'numberOfVotes']}
                                                                   rules={[
                                                                       {required: true, message: 'Missing number of votes'},
                                                                   ]}>
                                                            <InputNumber/>
                                                        </Form.Item>
                                                    );
                                                }}
                                            </Form.Item>
                                            <Form.Item noStyle shouldUpdate={() => false}>
                                                {() => {
                                                    return (
                                                        <Form.Item {...votingConfigField}
                                                                   label="Positive Votes Required"
                                                                   name={[votingConfigField.name, 'numberOfVotesRequired']}
                                                                   rules={[
                                                                       {required: true, message: 'Missing positive votes required'},
                                                                   ]}>
                                                            <InputNumber/>
                                                        </Form.Item>
                                                    );
                                                }}
                                            </Form.Item>
                                            <Form.Item label={" "}>
                                                <>
                                                    <Button onClick={() => remove(votingConfigField.name)} icon={<MinusCircleOutlined/>} type={"link"}/>
                                                </>
                                            </Form.Item>
                                        </Space>
                                    ))}
                                    <Form.Item style={{marginBottom: 0}}>
                                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined/>} size={"small"}>Add Voting Config</Button>
                                    </Form.Item>
                                    <Form.ErrorList errors={errors}/>
                                </Space>
                            )}
                        </Form.List>
                    </Col>
                    <Col span={24}>
                        <Form.List name={"participants"}>
                            {(participantsFields, {add, remove}, {errors}) => (
                                <Space direction={"vertical"} style={{width: "100%"}} size={"middle"}>
                                    {participantsFields.map((participantsField, participantIdx) => (
                                        <Card key={participantIdx} title={`Participant ${participantIdx + 1}`} extra={<Button onClick={() => remove(participantsField.name)} icon={<MinusCircleOutlined/>} type={"link"} size={"small"}/>} size={"small"}>
                                            <Row gutter={[16, 8]}>
                                                <Col span={18}>
                                                    <Form.Item noStyle shouldUpdate={() => false}>
                                                        {() => (
                                                            <Form.Item {...participantsField}
                                                                       label="Principal"
                                                                       name={[participantsField.name, 'principal']}
                                                                       rules={[
                                                                           {required: true, message: 'Missing principal'},
                                                                           {
                                                                               validator: async (_, principal) => {
                                                                                   const principalValid = isPrincipalValid(principal);
                                                                                   if (!principalValid) {
                                                                                       return Promise.reject(new Error('Invalid principal'));
                                                                                   }
                                                                               }
                                                                           }
                                                                       ]}
                                                                       wrapperCol={{span: 24}}
                                                            >
                                                                <Input style={{width: "100%"}}/>
                                                            </Form.Item>
                                                        )}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={6}>
                                                    <Form.Item noStyle shouldUpdate={() => false}>
                                                        {() => (
                                                            <>
                                                                <Form.Item {...participantsField}
                                                                           label="Name"
                                                                           name={[participantsField.name, 'name']}
                                                                           rules={[{required: true, message: 'Missing name'}]}
                                                                           wrapperCol={{span: 24}}
                                                                >
                                                                    <Input style={{width: "100%"}}/>
                                                                </Form.Item>
                                                            </>
                                                        )}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.List name={[participantsField.name, "permissions"]}>
                                                        {(fields, {add, remove}, {errors}) => (
                                                            <Space direction={"vertical"} style={{width: "100%"}} size={"small"}>
                                                                {fields.map(proposalPermissionField => (
                                                                    <Space key={proposalPermissionField.key} align="baseline" wrap={true}>
                                                                        <Form.Item noStyle shouldUpdate={() => false}>
                                                                            {() => (
                                                                                <Form.Item {...proposalPermissionField}
                                                                                           label="Proposal Type"
                                                                                           name={[proposalPermissionField.name, 'proposalType']}
                                                                                           rules={[
                                                                                               {required: true, message: 'Missing proposalType'},
                                                                                           ]}>
                                                                                    <Select style={{width: 200}}>
                                                                                        {(["UpdateGovernance", "UpgradeCanister", "CallCanister"] as Array<ProposalTypeUI>).map(item => (
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
                                                                                    <Form.Item {...proposalPermissionField}
                                                                                               label="Proposal Permissions"
                                                                                               name={[proposalPermissionField.name, 'permissions']}
                                                                                               rules={[
                                                                                                   {required: true, message: 'Missing permissions'},
                                                                                               ]}>
                                                                                        <Select style={{width: 250}} mode={"multiple"}>
                                                                                            {(["Add", "Vote", "Perform"]).map(item => (
                                                                                                <Select.Option key={item} value={item}>
                                                                                                    {item}
                                                                                                </Select.Option>
                                                                                            ))}
                                                                                        </Select>
                                                                                    </Form.Item>
                                                                                );
                                                                            }}
                                                                        </Form.Item>
                                                                        <Form.Item label={" "}>
                                                                            <>
                                                                                <Button onClick={() => remove(proposalPermissionField.name)} icon={<MinusCircleOutlined/>} type={"link"}/>
                                                                            </>
                                                                        </Form.Item>
                                                                    </Space>
                                                                ))}
                                                                <Form.Item style={{marginBottom: 0}}>
                                                                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined/>} size={"small"}>Add Permission</Button>
                                                                </Form.Item>
                                                                <Form.ErrorList errors={errors}/>
                                                            </Space>
                                                        )}
                                                    </Form.List>
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                            Add Participant
                                        </Button>
                                    </Form.Item>
                                    <Form.ErrorList errors={errors}/>
                                </Space>
                            )}
                        </Form.List>
                    </Col>
                    <Col span={24}>
                        <Form.Item label={"Description"} name={"description"}>
                            <Input.TextArea/>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>Submit</Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Space>
    </Modal>
}

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    console.log("createProposalDetail", formValues);
    const proposalDetail: ProposalDetail = {
        UpdateGovernance: {
            new_governance: {
                participants: _.map<FormValuesTypeParticipant, [Principal, GovernanceParticipant]>(formValues.participants, participant => {
                    const governanceParticipant: GovernanceParticipant = {
                        proposal_permissions: _.map<FormValuesTypeParticipantPermission, [ProposalType, Array<ProposalPermission>]>(participant.permissions, v => {
                            const proposalType: ProposalType = {[v.proposalType]: null} as ProposalType
                            const proposalPermissions: Array<ProposalPermission> = _.map(v.permissions, v => ({[v]: null} as ProposalPermission))
                            return [proposalType, proposalPermissions]
                        }),
                        name: participant.name
                    }
                    return [
                        Principal.fromText(participant.principal),
                        governanceParticipant
                    ]
                }),
                voting_configuration: _.map<FormValuesTypeVotingConfigElement, [ProposalType, VotingConfig]>(formValues.votingConfiguration, v => {
                    const proposalType: ProposalType = {[v.proposalType]: null} as ProposalType
                    return [
                        proposalType,
                        {
                            stop_vote_count: v.numberOfVotes,
                            positive_vote_count: v.numberOfVotesRequired
                        }
                    ]
                })
            }
        }
    };
    console.log("createProposalDetail result", proposalDetail);
    return proposalDetail
}