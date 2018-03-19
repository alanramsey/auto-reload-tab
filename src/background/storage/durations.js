import { DURATIONS } from '../../defaults';

const { storage } = browser;

export const validateDurations = durations =>
    durations instanceof Array &&
    durations.length >= 1 &&
    durations.every(n => typeof n === 'number' && n > 0);

export const getStoredDurations = async () => {
    const {durations} = await storage.local.get({
        durations: DURATIONS,
    });
    if (!validateDurations(durations)) {
        return DURATIONS;
    }
    return durations.filter(n => n > 0);
};

export const saveStoredDurations = durations =>
    storage.local.set({ durations });
