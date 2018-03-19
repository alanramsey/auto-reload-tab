import { h } from 'hyperapp';

import IntervalsSection from './intervals';
import SavedURLsSection from './savedURLs';
import ResetOnInteractionSection from './interaction';

import './style.css';

const OtherOptionsSection = () => (state, actions) => (
    <section>
        <h2>Other options</h2>
        <ResetOnInteractionSection
            hasPermission={state.allURLsPermission}
            requestPermission={actions.requestAllURLsPermission}
            value={state.defaultResetOnInteraction}
            set={actions.setResetOnInteraction}
        />
    </section>
);

const view = (state, actions) => (
    <div class="main-view">
        <h1>Auto Reload Tab options</h1>
        <IntervalsSection state={state} actions={actions} />
        <SavedURLsSection state={state} actions={actions} />
        <OtherOptionsSection state={state} actions={actions} />
    </div>
);

export default view;
