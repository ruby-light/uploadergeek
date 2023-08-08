import * as React from "react";
import {Typography} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import _ from "lodash"
import {Property} from "csstype";
import {truncateMiddle} from "geekfactory-js-util";

type Props = {
    principal: string
    truncateLength?: number
    color?: string
    copyButtonColor?: string
    fromEnd?: boolean
    className?: string;
    code?: boolean
    fontWeight?: Property.FontWeight
}

export const CopyablePrincipalComponent = (props: Props) => {
    return <Typography.Text code={props.code} className={props.className} copyable={{text: props.principal, tooltips: false, icon: <CopyOutlined style={{color: props.copyButtonColor || props.color}}/>}} style={{color: props.color, fontWeight: props.fontWeight || "normal"}}>{
        props.fromEnd === true ?
            _.truncate(props.principal, {length: props.truncateLength || 27}) :
            truncateMiddle(props.principal, props.truncateLength || 27)
    }</Typography.Text>
}