import { app } from 'hyperapp';

import actions from './actions';
import {
    loadDurations,
    loadResetOnInteraction,
    loadPageTimers
} from './storage';
import view from './view';

const main = async () => {
    const times = await loadDurations();
    const defaultResetOnInteraction = await loadResetOnInteraction();
    const allURLsPermission =
        await browser.permissions.contains({origins: ['<all_urls>']});
    const pageTimers = await loadPageTimers();
    const state = {
        savedTimes: times,
        times,
        defaultResetOnInteraction,
        allURLsPermission,
        savedPageTimers: pageTimers,
        pageTimers,
    };
    app(state, actions, view, document.body);
};

main();
