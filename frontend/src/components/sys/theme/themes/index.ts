import {Theme, ThemeId} from "../Theme"
import LightTheme from "./LightTheme";
import DarkTheme from "./DarkTheme";

/**
 * Themes also can be loaded with React.lazy( () => import("..."))
 */
export const themes: Record<ThemeId, Theme> = {
    "light": {
        id: 'light',
        displayName: 'Light',
        component: LightTheme,
    },
    "dark": {
        id: 'dark',
        displayName: 'Dark',
        component: DarkTheme,
    },
};
