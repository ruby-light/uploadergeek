import {createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren} from 'react';

type ResolvedTheme = 'light' | 'dark';
type ThemeType = ResolvedTheme | 'system';

type Context = {
    type: ThemeType;
    resolvedTheme: ResolvedTheme;
    setType: (type: ThemeType) => void;
    toggleTheme: () => void;
};

const Context = createContext<Context | undefined>(undefined);

export const useMediaTheme = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useMediaTheme must be used within a MediaThemeProvider');
    }
    return context;
};

type Props = {
    /**
     * controlled theme type
     */
    type: ThemeType;
    /**
     * notify parent to change theme type
     */
    onTypeChange: (type: ThemeType) => void;
    /**
     * toggled on <body> when dark is active
     */
    darkClassName?: string;
};

export const MediaThemeProvider = (props: PropsWithChildren<Props>) => {
    const {type, onTypeChange, darkClassName = 'gf-dark', children} = props;

    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(type));

    const toggleTheme = useCallback(() => {
        onTypeChange(type == 'dark' ? 'light' : 'dark');
    }, [type, onTypeChange]);

    useEffect(() => {
        setResolvedTheme(resolveTheme(type));

        if (type != 'system') {
            return;
        }

        const mediaQueryList = window.matchMedia(matchMediaDarkConstant);
        const handler = () => setResolvedTheme(mediaQueryList.matches ? 'dark' : 'light');

        mediaQueryList.addEventListener('change', handler);
        return () => {
            mediaQueryList.removeEventListener('change', handler);
        };
    }, [type]);

    useEffect(() => {
        applyHtmlClass(resolvedTheme, darkClassName);
    }, [resolvedTheme, darkClassName]);

    const value = useMemo<Context>(
        () => ({
            type,
            resolvedTheme,
            /**
             * delegate to parent
             */
            setType: onTypeChange,
            toggleTheme
        }),
        [type, resolvedTheme, onTypeChange, toggleTheme]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

const matchMediaDarkConstant = '(prefers-color-scheme: dark)';

const getSystemTheme = (): ResolvedTheme => {
    return window.matchMedia(matchMediaDarkConstant).matches ? 'dark' : 'light';
};

const resolveTheme = (type: ThemeType): ResolvedTheme => {
    return type == 'system' ? getSystemTheme() : type;
};

function applyHtmlClass(resolvedTheme: ResolvedTheme, className: string): void {
    if (resolvedTheme == 'dark') {
        document.body.classList.add(className);
    } else {
        document.body.classList.remove(className);
    }
}
