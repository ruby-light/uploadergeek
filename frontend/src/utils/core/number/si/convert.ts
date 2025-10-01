import {isNullish} from '@dfinity/utils';
import type {ValueWithUnit} from '../types';

const unitsSI = ['', 'K', 'M', 'G', 'T'];

export const convertFractionalAdaptiveSI = (value: bigint | undefined): ValueWithUnit | undefined => {
    if (isNullish(value) || value < 0n) {
        return undefined;
    }

    let numericValue = Number(value);
    let index = 0;

    while (index < unitsSI.length - 1 && numericValue >= 1000) {
        numericValue /= 1000;
        index++;
    }

    return {value: numericValue, unit: unitsSI[index]};
};
