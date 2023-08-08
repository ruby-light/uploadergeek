import * as React from "react";
import {Reducer, useReducer} from "react";
import _ from "lodash"
import {ModalButtonProps, ModalProps} from "src/components/common/ModalCommon";
import {useCustomCompareCallback} from "use-custom-compare";
import {Button, Form, Input, Modal, Space} from "antd";
import {useForm} from "antd/lib/form/Form";
import {FieldData} from "rc-field-form/lib/interface";
import {createICOptional, getICRequestErrName, isCanisterPrincipalValid, isErr, isOk} from "geekfactory-ic-js-util";
import {AddNewProposalArgs, AddNewProposalError, AddNewProposalResponse, CallCanister, ProposalDetail} from "declarations/governance/governance.did";
import {Principal} from "@dfinity/principal";
import {delayPromise, GFError, hasOwnProperty, KeysOfUnion} from "geekfactory-js-util";
import PubSub from "pubsub-js";
import {REFRESH_PROPOSALS_TOPIC} from "src/components/loggedIn/ProposalsSection";
import {useActorsContext} from "src/components/data/ActorsProvider";

type FormValuesType = {
    methodName: string
    canisterDid: string
    canisterId: string
    argumentCandid: string
    description: string
}

const initialValues: FormValuesType = {
    methodName: "",
    canisterDid: "",
    canisterId: "",
    argumentCandid: "",
    description: ""
}

const DEV_initialValues: FormValuesType = {
    methodName: "get_my_governance_participant",
    canisterDid: "",
    canisterId: "qsgjb-riaaa-aaaaa-aaaga-cai",
    argumentCandid: "(record{})",
    description: ""
}

const modalButtonsPropsInitialValue: ModalButtonProps = {
    ok: {disabled: false},
    cancel: {}
}

const title = `Create a new "Call Canister" proposal`

const okText = "Create"
const errorText = "Proposal cannot be created. Please try again later."

interface Props extends ModalProps {

}

export const AddProposalCallCanisterModalComponent = (props: Props) => {
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

    return <Modal width={735} closable={false} maskClosable={false} destroyOnClose={true}
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
                <Form.Item label="Method Name" name={"methodName"} rules={[{required: true, message: 'Missing method name'},]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Canister ID" name={"canisterId"} rules={[
                    {
                        required: true,
                        validator: (rule, value) => {
                            if (isCanisterPrincipalValid(value)) {
                                return Promise.resolve()
                            } else {
                                return Promise.reject("Invalid canister ID")
                            }
                        }
                    },
                ]}>
                    <Input/>
                </Form.Item>
                <Form.Item label="Argument Candid" name={"argumentCandid"} rules={[{required: true, message: 'Missing argument candid'},]}>
                    <Input.TextArea/>
                </Form.Item>
                <Form.Item label="Canister DID" name={"canisterDid"} rules={[]}>
                    <Input.TextArea/>
                </Form.Item>
                <Form.Item label={"Description"} name={"description"}>
                    <Input.TextArea/>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" disabled={modalButtonProps.ok.loading == true} loading={modalButtonProps.ok.loading}>Submit</Button>
                </Form.Item>
            </Space>
        </Form>
    </Modal>
}

const createProposalDetail = (formValues: FormValuesType): ProposalDetail | undefined => {
    const proposalDetail: ProposalDetail = {
        CallCanister: {
            task: {
                method: formValues.methodName,
                canister_id: Principal.fromText(formValues.canisterId),
                canister_did: createICOptional(_.isEmpty(formValues.canisterDid) ? undefined : formValues.canisterDid),
                argument_candid: formValues.argumentCandid,
                payment: createICOptional(),
            }
        }
    }
    console.log("createProposalDetail result", proposalDetail);
    return proposalDetail
}