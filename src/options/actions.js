import { assocPath, append, lensProp, merge, over, prop, remove, sortBy } from 'ramda';

import { defaultDurations, saveDurations, saveResetOnInteraction, savePageTimers } from './storage';
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
    assocPath(['pageTimers', index, 'url'], url, state);

const setSavedURLTime = ({ index, value }) => state =>
    assocPath(['pageTimers', index, 'time', 'value'], value, state);

const setSavedURLUnit = ({ index, unit }) => state =>
    assocPath(['pageTimers', index, 'time', 'unit'], unit, state);

const removePageTimer = index => state =>
    over(lensProp('pageTimers'), remove(index, 1), state);

const addPageTimer = () => state =>
    over(lensProp('pageTimers'), append(DEFAULT_SAVED_URL_ENTRY), state);

const savePageTimerList = () => ({ pageTimers }) => {
    const sorted = sortBy(prop('url'), pageTimers);
    savePageTimers(sorted);
    return {
        savedPageTimers: sorted,
        pageTimers: sorted
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
    removePageTimer,
    addPageTimer,
    savePageTimerList,
};

export default actions;
