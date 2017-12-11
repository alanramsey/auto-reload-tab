import { app } from 'hyperapp';

import actions from './actions';
import { loadDurations } from './storage';
import view from './view';

const main = async () => {
    app({
        state: {
            times: await loadDurations(),
        },
        actions,
        view,
    });
};

main();
