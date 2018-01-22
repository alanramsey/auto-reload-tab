import { h } from 'hyperapp';
import { equals } from 'ramda';

import './style.css';

const UNITS = ['seconds', 'minutes', 'hours'];

const unsaved = ({ savedTimes, times }) => !equals(savedTimes, times);

const capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);

const TimeUnit = ({ selected, setUnit }) => (
    <select class="browser-style" oninput={e => setUnit(e.target.value)}>
        {UNITS.map(unit => (
            <option value={unit} selected={unit === selected}>
                {capitalize(unit)}
            </option>
        ))}
    </select>
);

const Time = ({ time, remove, setUnit, setValue }) => (
    <div class="browser-style entry">
        <input
            class="browser-style duration-input"
            type="text"
            value={time.value === 0 ? '' : time.value}
            oninput={e => setValue(e.target.value)}
            oncreate={e => e.focus()}
        />
        <TimeUnit selected={time.unit} setUnit={setUnit} />
        <button class="browser-style" onclick={remove}>
            Remove
        </button>
    </div>
);

const RESET_ON_INTERACTION_RADIOS = [
    [
        'reset',
        'Reset timer after interacting with page',
        'If this is selected, the timer will be reset to zero when you click or type anywhere on the page'
    ],
    [
        'cancel',
        'Disable timer after interacting with page',
        'If this is selected, the timer will be turned off when you click or type anywhere on the page'
    ],
    [null, 'Neither']
];

const ResetOnInteractionRadio = ({
    checked,
    disabled,
    message,
    onclick,
    title
}) => (
    <label class="checkbox" title={title || ''}>
        <input
            type="radio"
            name="reset-on-interaction"
            checked={checked}
            onclick={onclick}
            disabled={disabled}
        />
        {message}
    </label>
);

const IntervalsSection = ({ state, actions }) => (
    <section>
        <h1>Intervals</h1>
        <div class="intervals">
            {state.times.map((time, index) => (
                <Time
                    time={time}
                    setValue={value => actions.setValue({ value, index })}
                    setUnit={unit => actions.setUnit({ unit, index })}
                    remove={() => actions.removeEntry(index)}
                />
            ))}
            <div>
                <button class="browser-style" onclick={actions.addEntry}>
                    Add
                </button>
                <button
                    class="browser-style reset-button"
                    onclick={actions.reset}
                >
                    Reset to default
                </button>
            </div>
            <div>
                <button
                    class={
                        'browser-style save-button ' +
                        (unsaved(state) ? 'default' : 'disabled')
                    }
                    onclick={actions.save}
                >
                    Save
                </button>
            </div>
        </div>
    </section>
);

const RequestAllUrlsPermission = ({ requestPermission }) => (
    <div>
        You must grant a permission to use this.
        <button class="browser-style" onclick={requestPermission}>
            Open permission dialog
        </button>
    </div>
);

const ResetOnInteractionSection = ({
    hasPermission,
    requestPermission,
    set,
    value
}) => (
    <section>
        <h2>Reset timer when interacting with page</h2>
        {hasPermission || (
            <RequestAllUrlsPermission requestPermission={requestPermission} />
        )}
        {RESET_ON_INTERACTION_RADIOS.map(([setting, message, title]) => (
            <ResetOnInteractionRadio
                checked={value === setting}
                message={message}
                onclick={() => set(setting)}
                title={title}
                disabled={!hasPermission}
            />
        ))}
    </section>
);

const OtherOptionsSection = ({ state, actions }) => (
    <section>
        <h1>Other options</h1>
        <ResetOnInteractionSection
            hasPermission={state.allURLsPermission}
            requestPermission={actions.requestAllURLsPermission}
            value={state.defaultResetOnInteraction}
            set={actions.setResetOnInteraction}
        />
    </section>
);

const view = state => actions => (
    <div>
        <IntervalsSection state={state} actions={actions} />
        <OtherOptionsSection state={state} actions={actions} />
    </div>
);

export default view;
