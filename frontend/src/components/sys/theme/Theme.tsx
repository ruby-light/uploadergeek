import * as React from "react";
import {useEffect} from "react";

export type ThemeId = "light" | "dark"

export type Theme = {
    id: ThemeId;
    displayName: string;
    component: React.ComponentType<any>;
}

export type LazyStyle = {
    use: () => void;
    unuse: () => void;
}

let counter = 0

export function useApplyStylesHook(styles: LazyStyle): void {
    useEffect(() => {
        counter--
        return () => styles.unuse();
    });
    counter++
    styles.use();
}

export const validateThemeId = (value: any): ThemeId => {
    switch (value) {
        case "dark":
            return "dark"
        default:
            return "light"
    }
}