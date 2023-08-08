import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import _ from "lodash"
import {useAuthProviderContext} from "geekfactory-ic-js-auth";

type Props = {}

export const AnonymousLoginPage = (props: Props) => {
    const authProviderContext = useAuthProviderContext();
    return <>
        <h1>Anonymous</h1>
        <h3>Please log in</h3>
        <button onClick={() => authProviderContext.login({source: "II"})}>Login with II</button>
    </>
}