import { computeThreshold } from '../../../scripts/logic/rolls-utils';

describe('Rolls Utilities', () => {
    describe('computeThreshold', () => {
        it('should calculate the threshold with default expertise', () => {
            expect(computeThreshold(1, 2)).toBe(14);
        });

        it('should calculate the threshold with explicit expertise', () => {
            expect(computeThreshold(1, 2, 3)).toBe(17);
        });

        it('should handle negative attribute modifiers', () => {
            expect(computeThreshold(5, -2, 1)).toBe(15);
        });

        it('should handle zero values', () => {
            expect(computeThreshold(0, 0, 0)).toBe(11);
        });
    });
});