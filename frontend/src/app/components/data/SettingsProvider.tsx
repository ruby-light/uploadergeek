import {createContext, useContext, useMemo, type PropsWithChildren} from 'react';

type Context = {
    currentAssetCanisterId: string;
    governanceCanisterId: string;
};

const SettingsContext = createContext<Context | undefined>(undefined);
export const useSettingsContext = () => {
    const context = useContext<Context | undefined>(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsContext.Provider');
    }
    return context;
};

type Props = Context;
export const SettingsProvider = (props: PropsWithChildren<Props>) => {
    const value: Context = useMemo<Context>(() => props, [props]);
    return <SettingsContext.Provider value={value}>{props.children}</SettingsContext.Provider>;
};
