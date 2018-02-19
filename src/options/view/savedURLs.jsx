import { h } from 'hyperapp';
import { equals } from 'ramda';

import Time from './time';

const unsaved = ({ savedURLTimers, urlTimers }) =>
    !equals(urlTimers, savedURLTimers);

const SavedURL = ({ time, url, remove, setTime, setUnit, setURL }) => (
    <div class="browser-style entry url-entry">
        <input
            class="browser-style url-input"
            type="text"
            placeholder="URL"
            value={url}
            oninput={e => setURL(e.target.value)}
            oncreate={e => e.focus()}
        />
        <Time
            time={time}
            remove={remove}
            setUnit={setUnit}
            setValue={setTime}
        />
    </div>
);

const SavedURLsSection = ({ state, actions }) => (
    <section>
        <h2>Saved timers</h2>
        <div>
            {state.urlTimers.map(({ time, url }, index) => (
                <SavedURL
                    url={url}
                    time={time}
                    setURL={url => actions.setSavedURL({ index, url })}
                    setUnit={unit => actions.setSavedURLUnit({ index, unit })}
                    setTime={value => actions.setSavedURLTime({ index, value })}
                    remove={() => actions.removeSavedURL(index)}
                />
            ))}
        </div>
        <button class="browser-style" onclick={() => actions.addSavedURL()}>
            Add
        </button>
        <div>
            <button
                class={
                    'browser-style save-button ' +
                    (unsaved(state) ? 'default' : 'disabled')
                }
                onclick={actions.saveSavedURLList}
            >
                Save
            </button>
        </div>
    </section>
);

export default SavedURLsSection;
