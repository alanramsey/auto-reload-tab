import { assocPath, append, lensProp, merge, over, prop, remove, sortBy } from 'ramda';

import { defaultDurations, saveDurations, saveResetOnInteraction, saveURLTimers } from './storage';
import { toSeconds } from './util';

const DEFAULT_ENTRY = { value: 1, unit: 'minutes' };

const DEFAULT_SAVED_URL_ENTRY = {
    url: 'https://example.com',
    time: DEFAULT_ENTRY,
};

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

const setSavedURL = ({ index, url }) => state =>
    assocPath(['urlTimers', index, 'url'], url, state);

const setSavedURLTime = ({ index, value }) => state =>
    assocPath(['urlTimers', index, 'time', 'value'], value, state);

const setSavedURLUnit = ({ index, unit }) => state =>
    assocPath(['urlTimers', index, 'time', 'unit'], unit, state);

const removeSavedURL = index => state =>
    over(lensProp('urlTimers'), remove(index, 1), state);

const addSavedURL = () => state =>
    over(lensProp('urlTimers'), append(DEFAULT_SAVED_URL_ENTRY), state);

const saveSavedURLList = () => ({ urlTimers }) => {
    const sorted = sortBy(prop('url'), urlTimers);
    saveURLTimers(sorted);
    return {
        savedURLTimers: sorted,
        urlTimers: sorted
    };
};

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
    setSavedURL,
    setSavedURLTime,
    setSavedURLUnit,
    removeSavedURL,
    addSavedURL,
    saveSavedURLList,
};

export default actions;
