import { app } from 'hyperapp';

import actions from './actions';
import { loadDurations } from './storage';
import view from './view';

const main = async () => {
    const times = await loadDurations();
    app({
        state: {
            savedTimes: times,
            times,
        },
        actions,
        view,
    });
};

main();
