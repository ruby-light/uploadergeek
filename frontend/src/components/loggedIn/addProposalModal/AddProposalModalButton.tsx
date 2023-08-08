import * as React from "react";
import {Reducer, useCallback, useReducer} from "react";
import {ModalOnDestroy, ModalVisibility} from "src/components/common/ModalCommon";
import useIsMounted from "src/components/sys/hooks/isMounted";
import {Button, Cascader} from "antd";
import {DefaultOptionType} from "antd/lib/cascader";
import {KeysOfUnion} from "geekfactory-js-util";
import {ProposalType} from "declarations/governance/governance.did";
import {SingleValueType} from "rc-cascader/lib/Cascader";
import _ from "lodash"
import {AddProposalUpdateGovernanceModalComponent} from "src/components/loggedIn/addProposalModal/AddProposalUpdateGovernanceModalComponent";
import {AddProposalCallCanisterModalComponent} from "src/components/loggedIn/addProposalModal/AddProposalCallCanisterModalComponent";
import {useCurrentParticipantContext} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {useCustomCompareMemo} from "use-custom-compare";

export type ProposalTypeUI = KeysOfUnion<ProposalType>

type OptionType = DefaultOptionType & {}

const optionsByType: { [key in ProposalTypeUI]: React.ReactNode } = {
    UpdateGovernance: <>Update Governance</>,
    UpgradeCanister: <>Upgrade Canister</>,
    CallCanister: <>Call Canister</>,
}

type Props = {}

export const AddProposalModalButton = (props: Props) => {
    const isMounted = useIsMounted()
    const currentParticipantContext = useCurrentParticipantContext();

    const displayRender = useCallback((label: string[], selectedOptions?: OptionType[]) => {
        const selectedOption: ProposalTypeUI = _.first(selectedOptions)!.value as ProposalTypeUI
        return optionsByType[selectedOption]
    }, [])

    const options: Array<OptionType> = useCustomCompareMemo(() => {
        return [
            {
                value: "UpdateGovernance",
                label: optionsByType["UpdateGovernance"],
                disabled: !currentParticipantContext.hasProposalPermission("UpdateGovernance", "Add"),
            },
            {
                value: "UpgradeCanister",
                label: optionsByType["UpgradeCanister"],
                disabled: !currentParticipantContext.hasProposalPermission("UpgradeCanister", "Add"),
            },
            {
                value: "CallCanister",
                label: optionsByType["CallCanister"],
                disabled: !currentParticipantContext.hasProposalPermission("CallCanister", "Add"),
            },
        ]
    }, [currentParticipantContext.hasProposalPermission], _.isEqual)

    ////////////////////////////////////////////////
    // UpdateGovernance modal
    ////////////////////////////////////////////////

    const [modalUpdateGovernanceVisible, setModalUpdateGovernanceVisible] = useReducer<Reducer<ModalVisibility, Partial<ModalVisibility>>>(
        (state, newState) => ({...state, ...newState}),
        {visible: false, nonce: 0}
    )

    const onModalUpdateGovernanceDestroy: ModalOnDestroy = useCallback(() => {
        if (isMounted()) {
            setModalUpdateGovernanceVisible({visible: false})
        }
    }, [isMounted])

    ////////////////////////////////////////////////
    // CallCanister modal
    ////////////////////////////////////////////////

    const [modalCallCanisterVisible, setModalCallCanisterVisible] = useReducer<Reducer<ModalVisibility, Partial<ModalVisibility>>>(
        (state, newState) => ({...state, ...newState}),
        {visible: false, nonce: 0}
    )

    const onModalCallCanisterDestroy: ModalOnDestroy = useCallback(() => {
        if (isMounted()) {
            setModalCallCanisterVisible({visible: false})
        }
    }, [isMounted])

    ////////////////////////////////////////////////
    // onChange
    ////////////////////////////////////////////////

    const onChange = useCallback((value: SingleValueType, selectOptions: OptionType[]) => {
        const selectedOption = _.first(value) as ProposalTypeUI
        console.log("selectedOption", selectedOption)
        switch (selectedOption) {
            case "UpdateGovernance": {
                setModalUpdateGovernanceVisible({visible: true, nonce: modalUpdateGovernanceVisible.nonce + 1})
                break;
            }
            case "CallCanister": {
                setModalCallCanisterVisible({visible: true, nonce: modalCallCanisterVisible.nonce + 1})
                break;
            }
        }
    }, [modalUpdateGovernanceVisible.nonce, modalCallCanisterVisible.nonce])

    return <>
        <AddProposalUpdateGovernanceModalComponent key={`addProposalUpdateGovernance${modalUpdateGovernanceVisible.nonce}`}
                                                   visible={modalUpdateGovernanceVisible.visible}
                                                   onDestroy={onModalUpdateGovernanceDestroy}
        />
        <AddProposalCallCanisterModalComponent key={`addProposalCallCanister${modalCallCanisterVisible.nonce}`}
                                                   visible={modalCallCanisterVisible.visible}
                                                   onDestroy={onModalCallCanisterDestroy}
        />
        <Cascader<OptionType>
            options={options}
            onChange={onChange}
            displayRender={displayRender}
            dropdownMatchSelectWidth={true}
            // popupClassName={"ug-cascader-menu"}
            // style={{width: "150px"}}
            disabled={false}
            size={"small"}
        ><Button>Add Proposal</Button></Cascader>

    </>
}