import {isNullish} from '@dfinity/utils';
import {formatDecimalString, roundDecimalString} from './decimal/decimal';
import type {ValueWithUnit} from './types';

export const formatNumber = (value: number | bigint | undefined | null, decimalPlaces: number = 2): string | undefined => {
    const rawFormatted = formatDecimalString(value);
    const rounded = roundDecimalString(rawFormatted, decimalPlaces);
    return formatDecimalString(rounded, {thousandSeparator: ' '});
};

export type Options = {
    decimalPlaces?: number;
    unitSpace?: string;
    fallback?: string;
};
export const formatValueWithUnit = (valueWithUnit: ValueWithUnit | undefined, options?: Options): string => {
    return formatNumberWithUnit(valueWithUnit?.value, valueWithUnit?.unit, options);
};

export const formatNumberWithUnit = (value: number | bigint | undefined, unit: string = '', options?: Options): string => {
    const {decimalPlaces = 2, fallback = '-', unitSpace = ''} = options || {};
    if (isNullish(value)) {
        return fallback;
    }
    const formatted = formatNumber(value, decimalPlaces);
    if (isNullish(formatted)) {
        return fallback;
    }
    return `${formatted}${unitSpace}${unit}`.trim();
};
