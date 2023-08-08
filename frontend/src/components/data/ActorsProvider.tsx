import * as React from "react";
import {PropsWithChildren, useMemo} from "react";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {idlFactory as idlGovernanceFactory} from 'declarations/governance';
import {_SERVICE as GovernanceService} from "declarations/governance/governance.did"
import {ActorSubclass, AnonymousIdentity, Identity} from "@dfinity/agent";
import {actorsByCanisterId} from "src/components/App";
import {IDL} from "@dfinity/candid";
import {CreateActorFn, useAuthProviderContext} from "geekfactory-ic-js-auth";
import {Canisters} from "src/ic/canisters";
import {reusePromiseWrapper} from "geekfactory-js-util";
import {createSimpleActor} from "src/ic/ActorUtils";
import {getCrc32} from '@dfinity/principal/lib/esm/utils/getCrc';

export type GetAnonymousGovernanceActorFn = () => Promise<ActorSubclass<GovernanceService> | undefined>
export type GetGovernanceActorFn = () => Promise<ActorSubclass<GovernanceService> | undefined>

export interface Context {
    getAnonymousGovernanceActor: GetAnonymousGovernanceActorFn
    getGovernanceActor: GetGovernanceActorFn
}

const ActorsContext = React.createContext<Context | undefined>(undefined);
export const useActorsContext = () => {
    const context = React.useContext<Context | undefined>(ActorsContext);
    if (!context) {
        throw new Error("useActorsContext must be used within a ActorsContext.Provider")
    }
    return context;
}

export const ActorsProvider = (props: PropsWithChildren<any>) => {
    const authProviderContext = useAuthProviderContext();

    const createActorWithReusedPromise: CreateActorFn = useMemo(() => {
        return reusePromiseWrapper(authProviderContext.createActor) as CreateActorFn
    }, [authProviderContext.createActor])

    const createAnonymousActorWithReusedPromise: CreateActorFn = useMemo(() => {
        return reusePromiseWrapper(createSimpleActor) as CreateActorFn
    }, [createSimpleActor])

    const getGovernanceActor: GetGovernanceActorFn = useCustomCompareCallback(async () => {
        if (!!process.env.IS_TEST_SERVER) {
            console.log("Will call getActor for authenticated governance")
        }
        return getActor<GovernanceService>(Canisters.governance, idlGovernanceFactory, authProviderContext.state.identity, createActorWithReusedPromise, "authenticated")
    }, [authProviderContext.state.identity, actorsByCanisterId, createActorWithReusedPromise], _.isEqual)

    const getAnonymousGovernanceActor: GetAnonymousGovernanceActorFn = useCustomCompareCallback(async () => {
        if (!!process.env.IS_TEST_SERVER) {
            console.log("Will call getActor for anonymous governance")
        }
        return getActor<GovernanceService>(Canisters.governance, idlGovernanceFactory, new AnonymousIdentity(), createAnonymousActorWithReusedPromise, "anonymous")
    }, [actorsByCanisterId, createAnonymousActorWithReusedPromise], _.isEqual)

    const value = useCustomCompareMemo<Context, [GetAnonymousGovernanceActorFn, GetGovernanceActorFn]>(() => ({
        getAnonymousGovernanceActor,
        getGovernanceActor,
    }), [
        getAnonymousGovernanceActor,
        getGovernanceActor,
    ], _.isEqual)
    return <ActorsContext.Provider value={value}>
        {props.children}
    </ActorsContext.Provider>
}

const getActor = async function <S>(canisterId: string, idlFactory: IDL.InterfaceFactory, identity: Identity | undefined, createActorFn: CreateActorFn, prefix?: string): Promise<ActorSubclass<S> | undefined> {
    let host: string | undefined = undefined
    let idlFactoryHash: number = 0

    try {
        const idlFactoryBuffer = new Buffer(idlFactory.toString());
        idlFactoryHash = getCrc32(idlFactoryBuffer);
    } catch (e) {
    }

    const uniqueKey = `${canisterId}_${idlFactoryHash}${prefix ? "_" + prefix : ""}`
    let actor: ActorSubclass<any> | undefined = actorsByCanisterId[uniqueKey]
    if (actor) {
        //reuse actor
        if (!!process.env.IS_TEST_SERVER) {
            console.log(`getActor[${uniqueKey}]: reuse actor`);
        }
        return actor
    }
    if (!!process.env.IS_TEST_SERVER) {
        console.log(`getActor[${uniqueKey}]: ask for actor`);
    }
    actor = await createActorFn<S>(canisterId, idlFactory, {
        agentOptions: {
            identity: identity,
            host: host
        }
    });
    actorsByCanisterId[uniqueKey] = actor
    if (!!process.env.IS_TEST_SERVER) {
        console.log(`getActor[${uniqueKey}]: new actor`, actor);
    }
    return actor
}