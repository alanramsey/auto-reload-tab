import { assocPath, append, lensProp, over, remove, sortBy } from 'ramda';

import { saveDurations } from './storage';
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
        times: sorted
    };
};

const actions = {
    setValue,
    setUnit,
    addEntry,
    removeEntry,
    save,
};

export default actions;
