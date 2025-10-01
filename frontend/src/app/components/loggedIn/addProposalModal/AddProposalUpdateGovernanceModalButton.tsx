import {Button} from 'antd';
import {useCallback, useReducer, type ReactNode, type Reducer} from 'react';
import type {ModalOnDestroy, ModalVisibility} from '../../common/ModalCommon';
import useIsMounted from '../../sys/hooks/isMounted';
import {AddProposalUpdateGovernanceModalComponent, type FormValuesType} from './AddProposalUpdateGovernanceModalComponent';

type Props = {
    label: string;
    icon: ReactNode;
    initialValues?: FormValuesType;
};

export const AddProposalUpdateGovernanceModalButton = (props: Props) => {
    const {label, initialValues, icon} = props;
    const isMounted = useIsMounted();

    ////////////////////////////////////////////////
    // modal
    ////////////////////////////////////////////////

    const [modalVisible, setModalVisible] = useReducer<Reducer<ModalVisibility, Partial<ModalVisibility>>>((state, newState) => ({...state, ...newState}), {visible: false, nonce: 0});

    const onModalDestroy: ModalOnDestroy = useCallback(() => {
        if (isMounted()) {
            setModalVisible({visible: false});
        }
    }, [isMounted]);

    ////////////////////////////////////////////////
    // onClick
    ////////////////////////////////////////////////

    const onClick = useCallback(() => {
        setModalVisible({visible: true, nonce: modalVisible.nonce + 1});
    }, [modalVisible.nonce]);

    return (
        <>
            <AddProposalUpdateGovernanceModalComponent key={`addProposal${modalVisible.nonce}`} visible={modalVisible.visible} onDestroy={onModalDestroy} initialValues={initialValues} />
            <Button onClick={onClick} icon={icon} size="small">
                {label}
            </Button>
        </>
    );
};
