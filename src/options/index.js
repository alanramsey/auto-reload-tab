import { app } from 'hyperapp';

import actions from './actions';
import { loadDurations, loadResetOnInteraction } from './storage';
import view from './view';

const main = async () => {
    const times = await loadDurations();
    const defaultResetOnInteraction = await loadResetOnInteraction();
    const allURLsPermission =
        await browser.permissions.contains({origins: ['<all_urls>']});
    app({
        state: {
            savedTimes: times,
            times,
            defaultResetOnInteraction,
            allURLsPermission,
        },
        actions,
        view,
    });
};

main();
