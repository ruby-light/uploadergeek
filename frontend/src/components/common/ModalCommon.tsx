import {ButtonProps} from "antd";

export type ModalVisibility = {
    visible: boolean
    nonce: number
}

export type ModalButtonProps = {
    ok: ButtonProps,
    cancel: ButtonProps
}

export type ModalOnDestroy = (ctx?:any) => void

export interface ModalProps {
    visible: boolean
    onDestroy: ModalOnDestroy
}
