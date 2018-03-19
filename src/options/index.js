import { app } from 'hyperapp';

import actions from './actions';
import {
    loadDurations,
    loadResetOnInteraction,
    loadURLTimers
} from './storage';
import view from './view';

const main = async () => {
    const times = await loadDurations();
    const defaultResetOnInteraction = await loadResetOnInteraction();
    const allURLsPermission =
        await browser.permissions.contains({origins: ['<all_urls>']});
    const urlTimers = await loadURLTimers();
    const state = {
        savedTimes: times,
        times,
        defaultResetOnInteraction,
        allURLsPermission,
        savedURLTimers: urlTimers,
        urlTimers,
    };
    app(state, actions, view, document.body);
};

main();
