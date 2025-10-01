import {Button} from 'antd';
import type {ReactNode, Reducer} from 'react';
import {useCallback, useReducer} from 'react';
import type {ModalOnDestroy, ModalVisibility} from '../../common/ModalCommon';
import useIsMounted from '../../sys/hooks/isMounted';
import type {FormValuesType} from './AddProposalCallCanisterModalComponent';
import {AddProposalCallCanisterModalComponent} from './AddProposalCallCanisterModalComponent';

type Props = {
    label: string;
    icon: ReactNode;
    initialValues?: FormValuesType;
};

export const AddProposalCallCanisterModalButton = (props: Props) => {
    const {label, icon, initialValues} = props;
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
            <AddProposalCallCanisterModalComponent key={`addProposal${modalVisible.nonce}`} visible={modalVisible.visible} onDestroy={onModalDestroy} initialValues={initialValues} />
            <Button onClick={onClick} icon={icon}>
                {label}
            </Button>
        </>
    );
};
