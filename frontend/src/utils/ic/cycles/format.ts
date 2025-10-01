import {formatValueWithUnit, type Options} from '../../core/number/format';
import {convertFractionalAdaptiveSI} from '../../core/number/si/convert';
import type {ValueWithUnit} from '../../core/number/types';

const UNIT_SPACE = '';
const DECIMAL_PLACES = 4;

export const formatCycles = (cycles: bigint | undefined, options?: Options): string => {
    return formatCyclesValueWithUnit(convertFractionalAdaptiveSI(cycles), options);
};

export const formatCyclesValueWithUnit = (valueWithUnit: ValueWithUnit | undefined, options?: Options): string => {
    const {decimalPlaces = DECIMAL_PLACES, fallback} = options || {};
    return formatValueWithUnit(valueWithUnit, {decimalPlaces, fallback, unitSpace: UNIT_SPACE});
};
