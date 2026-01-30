/**
 * Maximum timeout limit for setTimeout and setInterval
 * The maximum value is 2^31 - 1 (2147483647) milliseconds, which is approximately 24.8 days.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
 */
const MAX_TIMEOUT_LIMIT = 2147483647;

/**
 * Returns a safe timeout value for setTimeout and setInterval.
 * The value is clamped to be between 0 and MAX_TIMEOUT_LIMIT.
 * @param durationMillis - The desired timeout value in milliseconds.
 * @returns A safe timeout value.
 */
export const getSafeTimerTimeout = (durationMillis: number) => {
    return Math.min(Math.max(0, durationMillis), MAX_TIMEOUT_LIMIT);
};
