import * as React from "react";
import {PropsWithChildren, Suspense} from "react";
import {Theme, ThemeId} from "./Theme";

interface Props {
    themes: Record<ThemeId, Theme>,
    value: string,
}

export const DynamicThemeSuspenseWrapper = React.memo(({children, themes, value}: PropsWithChildren<Props>) => {
    const Component = themes[value]?.component;

    // @ts-ignore
    return <Suspense fallback={<></>}><Component>{children}</Component></Suspense>
})
