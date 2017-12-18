import { DURATIONS } from '../defaults';
import { toSeconds } from './util';

const timeWithUnit = seconds => {
    if (seconds % (60 * 60) === 0) {
        return {
            unit: 'hours',
            value: seconds / (60 * 60),
        };
    } else if (seconds % 60 === 0) {
        return {
            unit: 'minutes',
            value: seconds / 60,
        };
    } else {
        return {
            unit: 'seconds',
            value: seconds,
        };
    }
};

export const defaultDurations = DURATIONS.map(timeWithUnit);

export const loadDurations = async () => {
    const { durations } = await browser.storage.local.get({
        durations: DURATIONS,
    });
    return durations.map(timeWithUnit);
};

export const saveDurations = times => browser.storage.local.set({
    durations: times.map(toSeconds),
});
