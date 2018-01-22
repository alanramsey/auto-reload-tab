import { assocPath, append, lensProp, merge, over, remove, sortBy } from 'ramda';

import { defaultDurations, saveDurations, saveResetOnInteraction } from './storage';
import { toSeconds } from './util';

const DEFAULT_ENTRY = { value: 1, unit: 'minutes' };

const setValue = ({ index, value }) => state => {
    const parsed = value === '' ? 0 : parseInt(value);
    const valid = parsed >= 0 && !isNaN(parsed);
    if (valid) {
        return assocPath(['times', index, 'value'], parsed, state);
    }
    return {};
};

const setUnit = ({ index, unit }) => state =>
    assocPath(['times', index, 'unit'], unit, state);

const addEntry = () => state => over(lensProp('times'), append(DEFAULT_ENTRY), state);

const removeEntry = index => state => over(lensProp('times'), remove(index, 1), state);

const save = () => ({ times }) => {
    const sorted = sortBy(toSeconds, times);
    saveDurations(sorted);
    return {
        savedTimes: sorted,
        times: sorted,
    };
};

const reset = () => ({
    times: defaultDurations,
});

const setResetOnInteraction = defaultResetOnInteraction => state => {
    saveResetOnInteraction(defaultResetOnInteraction);
    return merge(state, {
        defaultResetOnInteraction,
    });
};

const requestAllURLsPermission = () => () => async actions => {
    const permission = await browser.permissions.request({
        origins: ['<all_urls>'],
    });
    if (permission) {
        actions.setAllURLsPermission(true);
    }
};

const setAllURLsPermission = isGranted => state =>
    merge(state, {
        allURLsPermission: isGranted,
    });

const actions = {
    setValue,
    setUnit,
    addEntry,
    removeEntry,
    save,
    reset,
    setResetOnInteraction,
    requestAllURLsPermission,
    setAllURLsPermission,
};

export default actions;
