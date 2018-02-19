import { h } from 'hyperapp';
import { equals } from 'ramda';

import Time from './time';

const unsaved = ({ savedTimes, times }) => !equals(savedTimes, times);

const IntervalsSection = ({ state, actions }) => (
    <section>
        <h2>Intervals</h2>
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

export default IntervalsSection;
