import {IDL} from "@dfinity/candid";
import {Actor, ActorSubclass, HttpAgent} from "@dfinity/agent";
import {CreateActorFn, CreateActorOptions} from "geekfactory-ic-js-auth";

export const createSimpleActor: CreateActorFn = async <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions): Promise<ActorSubclass<T> | undefined> => {
    const agent = new HttpAgent({...options?.agentOptions});

    return Actor.createActor(idlFactory, {
        agent,
        canisterId,
        ...options?.actorOptions,
    });
}