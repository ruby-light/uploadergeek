import {convertFractionalAdaptiveSI} from './convert';

describe('convertFractionalAdaptiveSI', () => {
    it('should return undefined for undefined input', () => {
        expect(convertFractionalAdaptiveSI(undefined)).toBeUndefined();
    });

    it('should return undefined for negative values', () => {
        expect(convertFractionalAdaptiveSI(-1n)).toBeUndefined();
        expect(convertFractionalAdaptiveSI(-1000n)).toBeUndefined();
    });

    it('should return value with empty unit for values less than 1000', () => {
        expect(convertFractionalAdaptiveSI(0n)).toEqual({value: 0, unit: ''});
        expect(convertFractionalAdaptiveSI(1n)).toEqual({value: 1, unit: ''});
        expect(convertFractionalAdaptiveSI(999n)).toEqual({value: 999, unit: ''});
    });

    it('should convert to K unit for thousands', () => {
        expect(convertFractionalAdaptiveSI(1000n)).toEqual({value: 1, unit: 'K'});
        expect(convertFractionalAdaptiveSI(1500n)).toEqual({value: 1.5, unit: 'K'});
        expect(convertFractionalAdaptiveSI(999000n)).toEqual({value: 999, unit: 'K'});
    });

    it('should convert to M unit for millions', () => {
        expect(convertFractionalAdaptiveSI(1000000n)).toEqual({value: 1, unit: 'M'});
        expect(convertFractionalAdaptiveSI(2500000n)).toEqual({value: 2.5, unit: 'M'});
        expect(convertFractionalAdaptiveSI(999000000n)).toEqual({value: 999, unit: 'M'});
    });

    it('should convert to G unit for billions', () => {
        expect(convertFractionalAdaptiveSI(1000000000n)).toEqual({value: 1, unit: 'G'});
        expect(convertFractionalAdaptiveSI(3750000000n)).toEqual({value: 3.75, unit: 'G'});
        expect(convertFractionalAdaptiveSI(999000000000n)).toEqual({value: 999, unit: 'G'});
    });

    it('should convert to T unit for trillions', () => {
        expect(convertFractionalAdaptiveSI(1000000000000n)).toEqual({value: 1, unit: 'T'});
        expect(convertFractionalAdaptiveSI(5250000000000n)).toEqual({value: 5.25, unit: 'T'});
    });

    it('should cap at T unit for very large values', () => {
        expect(convertFractionalAdaptiveSI(1000000000000000n)).toEqual({value: 1000, unit: 'T'});
        expect(convertFractionalAdaptiveSI(5000000000000000n)).toEqual({value: 5000, unit: 'T'});
    });
});
