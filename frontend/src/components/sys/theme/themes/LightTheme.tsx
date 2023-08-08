import * as React from 'react';
import {PropsWithChildren} from 'react';
import styles from "src/css/themes/light/light.theme.less";
import {useApplyStylesHook} from "../Theme";

export default function LightTheme(props: PropsWithChildren<any>) {
    useApplyStylesHook(styles);
    return <>{props.children}</>;
}