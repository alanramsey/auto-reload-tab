import { sortBy, mergeAll, prop } from 'ramda';

import { DURATIONS } from '../defaults';
import * as Messages from '../messages';
import { toSeconds } from './util';
import normalizeURL from '../utils/normalizeURL';

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

export const loadDurations = async () =>
    browser.runtime.sendMessage({
        type: Messages.GetDurationList,
    }).then(durations => durations.map(timeWithUnit));

export const saveDurations = times =>
    browser.runtime.sendMessage({
        type: Messages.SaveDurationList,
        durations: times.map(toSeconds),
    });

export const loadResetOnInteraction = () =>
    browser.runtime.sendMessage({
        type: Messages.GetDefaultResetOnInteraction,
    });

export const saveResetOnInteraction = defaultResetOnInteraction =>
    browser.runtime.sendMessage({
        type: Messages.SaveDefaultResetOnInteraction,
        defaultResetOnInteraction,
    });

const pageTimersToArray = timers =>
    sortBy(
        prop('url'),
        Object.entries(timers).map(([url, { duration }]) => ({
            time: timeWithUnit(duration),
            url: decodeURI(url),
        }))
    );

const pageTimersFromArray = async array => {
    const oldPageTimers = await browser.runtime.sendMessage({
        type: Messages.GetPageTimers,
    });
    const pageTimers = {};
    for (const { url, time } of array) {
        const duration = toSeconds(time);
        const normalized = normalizeURL(url);
        pageTimers[normalized] = mergeAll([
            { resetOnInteraction: null },
            oldPageTimers[normalized] || {},
            { duration }
        ]);
    }
    return pageTimers;
};

export const loadPageTimers = () =>
    browser.runtime.sendMessage({
        type: Messages.GetPageTimers,
    }).then(pageTimersToArray);

export const savePageTimers = timers =>
    pageTimersFromArray(timers).then(
        pageTimers => browser.runtime.sendMessage({
            type: Messages.SavePageTimers,
            pageTimers,
        })
    );
