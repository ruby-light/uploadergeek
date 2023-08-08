import * as React from 'react';
import {PropsWithChildren} from 'react';
import styles from "src/css/themes/dark/dark.theme.less";
import {useApplyStylesHook} from "../Theme";

export default function DarkTheme(props: PropsWithChildren<any>) {
    useApplyStylesHook(styles);
    return <>{props.children}</>;
}