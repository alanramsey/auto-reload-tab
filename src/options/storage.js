import normalizeURL from 'normalize-url';
import { sortBy, merge, prop } from 'ramda';

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

export const loadResetOnInteraction = () =>
    browser.storage.local.get({
        defaultResetOnInteraction: null,
    }).then(results => results.defaultResetOnInteraction);

export const saveResetOnInteraction = defaultResetOnInteraction =>
    browser.storage.local.set({
        defaultResetOnInteraction,
    });

const urlTimersToArray = timers =>
    sortBy(
        prop('url'),
        Object.entries(timers).map(([url, { duration }]) => ({
            time: timeWithUnit(duration),
            url: decodeURI(url),
        }))
    );

const urlTimersFromArray = async array => {
    const { pageTimers: oldPageTimers } = await browser.storage.local.get({
        pageTimers: {}
    });
    const pageTimers = {};
    for (const { url, time } of array) {
        const duration = toSeconds(time);
        const normalized = normalizeURL(url);
        pageTimers[normalized] = merge(oldPageTimers[normalized] || {}, { duration });
    }
    return pageTimers;
};

export const loadURLTimers = () =>
    browser.storage.local.get({
        pageTimers: {}
    }).then(results => urlTimersToArray(results.pageTimers));

export const saveURLTimers = timers =>
    urlTimersFromArray(timers).then(
        pageTimers =>
            browser.storage.local.set({
                pageTimers
            })
    );
