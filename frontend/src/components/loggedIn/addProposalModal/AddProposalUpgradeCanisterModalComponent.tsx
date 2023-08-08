import * as React from "react";
import {Reducer, useReducer} from "react";
import _ from "lodash"
import {ModalButtonProps, ModalProps} from "src/components/common/ModalCommon";
import {Button, Form, Input, Modal, Space} from "antd";
import {useForm} from "antd/lib/form/Form";
import {FieldData} from "rc-field-form/lib/interface";
import {createICOptional, getICRequestErrName, isCanisterPrincipalValid, isErr, isOk, isPrincipalValid} from "geekfactory-ic-js-util";
import {AddNewProposalArgs, AddNewProposalError, AddNewProposalResponse, ProposalDetail} from "declarations/governance/governance.did";
import {Principal} from "@dfinity/principal";
import {delayPromise, GFError, hasOwnProperty, KeysOfUnion} from "geekfactory-js-util";
import PubSub from "pubsub-js";
import {REFRESH_PROPOSALS_TOPIC} from "src/components/loggedIn/ProposalsSection";
import {useActorsContext} from "src/components/data/ActorsProvider";

type FormValuesType = {
    uploaderId: string
    operatorId: string
    canisterId: string
    moduleHash: string
    argumentCandid: string
    description: string
}

const initialValues: FormValuesType = {
    uploaderId: "",
    operatorId: "",
    canisterId: "",
    moduleHash: "",
    argumentCandid: "",
    description: ""
}

const DEV_initialValues: FormValuesType = {
    uploaderId: "qaa6y-5yaaa-aaaaa-aaafa-cai",
    operatorId: "myqmt-pj6bp-oenqu-pnjbc-qglgl-elokq-n54ms-gyyds-ao5hs-ldrvi-zqe",
    canisterId: "qsgjb-riaaa-aaaaa-aaaga-cai",
    moduleHash: "65dc805fefad650babd7156aaa45e76b978950c3f9ca0e31a12c5f6014514b45",
    argumentCandid: "(record{})",
    description: ""
}

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: false},
    cancel: {}
}

const title = `Create a new "Upgrade Canister" proposal`

const okText = "Create"
const errorText = "Proposal cannot be created. Please try again later."

interface Props extends ModalProps {

}

export const AddProposalUpgradeCanisterModalComponent = (props: Props) => {
    const actorsContext = useActorsContext();

    const formDefaultValues = process.env.NODE_ENV === "development" ? DEV_initialValues : initialValues
    // const formDefaultValues = initialValues

    const [form] = useForm<FormValuesType>()
    const [modalButtonProps, setModalButtonProps] = useReducer<Reducer<ModalButtonProps, Partial<ModalButtonProps>>>(
        (state, newState) => ({...state, ...newState}),
        modalButtonsPropsInitialValue
    )

    const asyncAdd = async (formValues: FormValuesType) => {
        try {
            console.log("onCreateProposal: formValues", formValues);
            const {description} = formValues
            const proposalDetail = createProposalDetail(formValues)

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
                    form && form.setFields([{name: "description", errors: [localErrorText]}])
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

    return <Modal width={735} closable={false} maskClosable={false} destroyOnClose={true} keyboard={false}
                  open={props.visible} title={title} onCancel={onCancel} okText={okText} onOk={onOk}
                  okButtonProps={modalButtonProps.ok} cancelButtonProps={modalButtonProps.cancel} /*className={"ug-modal"}*/
                  footer={null}>
        <Form form={form}
              layout="vertical"
              requiredMark={true}
              initialValues={formDefaultValues}
              onFinish={onFormFinish}
              onFieldsChange={onFormFieldsChange}
              autoComplete={"off"}>
            <Space direction={"vertical"} style={{width: "100%"}} size={"middle"}>
                <Form.Item label="Uploader Principal" name={"uploaderId"} rules={[
                    {
                        required: true,
                        validator: (rule, value) => {
                            if (isCanisterPrincipalValid(value)) {
                                return Promise.resolve()
                            } else {
                                return Promise.reject("Invalid uploader principal")
                            }
                        }
                    },
                ]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Operator Principal" name={"operatorId"} rules={[
                    {
                        required: true,
                        validator: (rule, value) => {
                            if (isPrincipalValid(value)) {
                                return Promise.resolve()
                            } else {
                                return Promise.reject("Invalid operator principal")
                            }
                        }
                    },
                ]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Canister Principal" name={"canisterId"} rules={[
                    {
                        required: true,
                        validator: (rule, value) => {
                            if (isCanisterPrincipalValid(value)) {
                                return Promise.resolve()
                            } else {
                                return Promise.reject("Invalid canister principal")
                            }
                        }
                    },
                ]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Module Hash" name={"moduleHash"} rules={[{required: true, message: 'Missing module hash'},]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Argument Candid" name={"argumentCandid"} rules={[{required: true, message: 'Missing argument candid'},]}>
                    <Input.TextArea/>
                </Form.Item>
                <Form.Item label={"Description"} name={"description"}>
                    <Input.TextArea/>
                </Form.Item>
                <Space style={{width: "100%", justifyContent: "end"}}>
                    <Button type="default" onClick={props.onDestroy} disabled={modalButtonProps.ok.loading == true}>Cancel</Button>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>Submit</Button>
                    </Form.Item>
                </Space>
            </Space>
        </Form>
    </Modal>
}

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    const proposalDetail: ProposalDetail = {
        UpgradeCanister: {
            task: {
                uploader_id: Principal.fromText(formValues.uploaderId),
                operator_id: Principal.fromText(formValues.operatorId),
                canister_id: Principal.fromText(formValues.canisterId),
                module_hash: formValues.moduleHash,
                argument_candid: formValues.argumentCandid,
            }
        }
    }
    console.log("createProposalDetail result", proposalDetail);
    return proposalDetail
}