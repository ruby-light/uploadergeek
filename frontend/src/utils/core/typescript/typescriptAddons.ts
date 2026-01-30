export type KeysOfUnion<T> = T extends T ? keyof T : never;

export function hasProperty<T extends object, K extends KeysOfUnion<T>>(obj: T, prop: K): obj is Extract<T, Record<K, unknown>> {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export type Record_Partial<F> = {[P in keyof F]?: Partial<F[P]>};

export type WithoutUndefined<T, Keys extends keyof T = keyof T> = {
    [K in keyof T]: K extends Keys ? NonNullable<T[K]> : T[K];
};
