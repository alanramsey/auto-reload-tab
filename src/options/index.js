import { app } from 'hyperapp';

import actions from './actions';
import { loadDurations, loadResetOnInteraction } from './storage';
import view from './view';

const main = async () => {
    const times = await loadDurations();
    const defaultResetOnInteraction = await loadResetOnInteraction();
    app({
        state: {
            savedTimes: times,
            times,
            defaultResetOnInteraction,
        },
        actions,
        view,
    });
};

main();
