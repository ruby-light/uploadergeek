import * as React from "react";
import {PropsWithChildren, useCallback, useEffect, useState} from "react";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {ThemeId} from "./Theme";
import {themes} from "./themes/index";
import {DynamicThemeSuspenseWrapper} from "./DynamicThemeSuspenseWrapper";
import {useMediaQuery} from "src/components/sys/hooks/useMediaQuery";
import {userSettingsStorage} from "src/components/data/UserSettingsStorage";

const defaultThemeIdOnStart: ThemeId = userSettingsStorage.theme;
// console.log("defaultThemeIdOnStart", defaultThemeIdOnStart);

const defaultTheme = themes[defaultThemeIdOnStart];

// Analytics.UserProfile.setTheme(defaultThemeIdOnStart)

export type SelectThemeIdFn = (value: ThemeId) => void

export interface Context {
    themeId: ThemeId
    selectThemeId: SelectThemeIdFn
    isDarkTheme: boolean
}

const AppThemeContext = React.createContext<Context | undefined>(undefined);
export const useAppThemeContext = () => {
    const context = React.useContext<Context | undefined>(AppThemeContext);
    if (!context) {
        throw new Error("useAppThemeContext must be used within a AppThemeContext.Provider")
    }
    return context;
}

export const AppThemeProvider = (props: PropsWithChildren<any>) => {
    const [themeId, setThemeId] = useState(defaultTheme.id);

    const selectThemeId: SelectThemeIdFn = useCallback((value: ThemeId) => {
        setThemeId(value)
        userSettingsStorage.theme = value
        // Analytics.UserProfile.setTheme(value)
    }, []);
    const isDarkTheme: boolean = themeId == "dark"

    const isSystemDarkModeOn = useMediaQuery("(prefers-color-scheme: dark)")

    useEffect(() => {
        if (isSystemDarkModeOn) {
            (document.getElementById("faviconLink") as HTMLLinkElement).href = "/favicon-64-dark.svg"
        } else {
            (document.getElementById("faviconLink") as HTMLLinkElement).href = "/favicon-64.svg"
        }
    }, [isSystemDarkModeOn])

    const value = useCustomCompareMemo<Context, [string, SelectThemeIdFn, boolean]>(() => ({
        themeId,
        selectThemeId,
        isDarkTheme,
    }), [
        themeId,
        selectThemeId,
        isDarkTheme,
    ], _.isEqual)

    return <AppThemeContext.Provider value={value}>
        <DynamicThemeSuspenseWrapper themes={themes} value={themeId}>
            {props.children}
        </DynamicThemeSuspenseWrapper>
    </AppThemeContext.Provider>
}