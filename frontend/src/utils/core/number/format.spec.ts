import {formatNumber, formatNumberWithUnit} from './format';

describe('format utils', () => {
    describe('formatNumber', () => {
        it('should format regular numbers with default 2 decimal places', () => {
            expect(formatNumber(1234.567)).toBe('1 234.57');
            expect(formatNumber(BigInt(1234))).toBe('1 234');
            expect(formatNumber(1000)).toBe('1 000');
            expect(formatNumber(0)).toBe('0');
        });

        it('should format numbers with custom decimal places', () => {
            expect(formatNumber(1234.567, 0)).toBe('1 235');
            expect(formatNumber(1234.567, 1)).toBe('1 234.6');
            expect(formatNumber(1234.567)).toBe('1 234.57');
            expect(formatNumber(1234.567, 2)).toBe('1 234.57');
            expect(formatNumber(1234.567, 3)).toBe('1 234.567');
            expect(formatNumber(1234.567, 4)).toBe('1 234.567');
            expect(formatNumber(1234.56789, 4)).toBe('1 234.5679');
        });

        it('should format bigint values', () => {
            expect(formatNumber(BigInt(1234567))).toBe('1 234 567');
            expect(formatNumber(BigInt(0))).toBe('0');
        });

        it('should handle negative numbers', () => {
            expect(formatNumber(-1234.567)).toBe('-1 234.57');
            expect(formatNumber(BigInt(-1234))).toBe('-1 234');
            expect(formatNumber(-1000, 0)).toBe('-1 000');
        });

        it('should handle very large numbers', () => {
            expect(formatNumber(1234567890.123)).toBe('1 234 567 890.12');
            expect(formatNumber(999999999999.99)).toBe('999 999 999 999.99');
            expect(formatNumber(Number.MAX_SAFE_INTEGER)).toBe('9 007 199 254 740 991');
            expect(formatNumber(Number.MIN_SAFE_INTEGER)).toBe('-9 007 199 254 740 991');
            expect(formatNumber(1e10)).toBe('10 000 000 000');
            expect(formatNumber(1e20)).toBeUndefined();
        });

        it('should handle very small numbers', () => {
            expect(formatNumber(0.001)).toBe('0');
            expect(formatNumber(0.001, 3)).toBe('0.001');
            expect(formatNumber(0.0001, 4)).toBe('0.0001');
        });

        it('should round numbers correctly (ROUND_HALF_UP)', () => {
            expect(formatNumber(1.235, 2)).toBe('1.24');
            expect(formatNumber(1.234, 2)).toBe('1.23');
            expect(formatNumber(1.999, 2)).toBe('2');
        });

        it('should return undefined for invalid inputs', () => {
            expect(formatNumber(NaN)).toBeUndefined();
            expect(formatNumber(Infinity)).toBeUndefined();
            expect(formatNumber(-Infinity)).toBeUndefined();
        });
    });

    describe('formatNumberWithUnit', () => {
        it('returns fallback when value is undefined', () => {
            expect(formatNumberWithUnit(undefined, 'ICP')).toBe('-');
        });

        it('formats number with two decimals by default', () => {
            expect(formatNumberWithUnit(1234.567, 'ICP')).toBe('1 234.57ICP');
        });

        it('respects unitSpace option', () => {
            expect(formatNumberWithUnit(1000, 'ICP', {unitSpace: ' '})).toBe('1 000 ICP');
        });

        it('works with bigint', () => {
            expect(formatNumberWithUnit(1234n, 'ICP')).toBe('1 234ICP');
            expect(formatNumberWithUnit(1234567890123456789n, 'ICP')).toBe('-');
        });

        it('respects decimalPlaces option', () => {
            expect(formatNumberWithUnit(12.3456, 'ICP', {decimalPlaces: 4})).toBe('12.3456ICP');
        });

        it('handles empty unit', () => {
            expect(formatNumberWithUnit(42)).toBe('42');
        });

        it('uses custom fallback', () => {
            expect(formatNumberWithUnit(undefined, 'ICP', {fallback: 'N/A'})).toBe('N/A');
        });
    });
});
