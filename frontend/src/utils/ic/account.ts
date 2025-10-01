import {isIcpAccountIdentifier, type Account} from '@dfinity/ledger-icp';
import type {IcrcAccount} from '@dfinity/ledger-icrc';
import {decodeIcrcAccount, encodeIcrcAccount} from '@dfinity/ledger-icrc';
import {isNullish, toNullable} from '@dfinity/utils';

export type AccountVariant = {accountIdentifierHex: string} | {icrcAccount: IcrcAccount};

export const decodeAccountVariantSafe = (encodedValue: string | undefined, options: {tryToParseLegacyICPHex?: boolean; allowAnonymousOwner?: boolean} = {}): AccountVariant | undefined => {
    const {tryToParseLegacyICPHex = true, allowAnonymousOwner = false} = options;
    if (isNullish(encodedValue)) {
        return undefined;
    }
    if (tryToParseLegacyICPHex && isIcpAccountIdentifier(encodedValue)) {
        return {accountIdentifierHex: encodedValue};
    }
    const icrcAccount = decodeIcrcAccountSafe(encodedValue);
    if (icrcAccount == undefined) {
        return undefined;
    }
    if (!allowAnonymousOwner && icrcAccount.owner.isAnonymous()) {
        return undefined;
    }
    return {icrcAccount: icrcAccount};
};

export const encodeAccountVariantSafe = (accountVariant: AccountVariant | undefined): string | undefined => {
    if (isNullish(accountVariant)) {
        return undefined;
    }
    if ('accountIdentifierHex' in accountVariant) {
        return accountVariant.accountIdentifierHex;
    } else if ('icrcAccount' in accountVariant) {
        return encodeIcrcAccountSafe(accountVariant.icrcAccount);
    }
    return undefined;
};

export const icrcAccountToAccount = (icrcAccount: IcrcAccount): Account => {
    return {
        owner: icrcAccount.owner,
        subaccount: toNullable(icrcAccount.subaccount)
    };
};

const decodeIcrcAccountSafe = (accountString: string | undefined): IcrcAccount | undefined => {
    try {
        if (accountString == undefined) {
            return undefined;
        }
        return decodeIcrcAccount(accountString);
    } catch {}
};

export const encodeIcrcAccountSafe = (icrcAccount: IcrcAccount | undefined): string | undefined => {
    try {
        if (icrcAccount == undefined) {
            return undefined;
        }
        return encodeIcrcAccount(icrcAccount);
    } catch {}
};
