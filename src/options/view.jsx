import { h } from 'hyperapp';

const UNITS = ['seconds', 'minutes', 'hours'];

const capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);

const TimeUnit = ({ selected, setUnit }) => (
    <select oninput={e => setUnit(e.target.value)}>
        {UNITS.map(unit => (
            <option value={unit} selected={unit === selected}>
                {capitalize(unit)}
            </option>
        ))}
    </select>
);

const Time = ({ time, remove, setUnit, setValue }) => (
    <div>
        <input
            type="text"
            value={time.value === 0 ? '' : time.value}
            oninput={e => setValue(e.target.value)}
        />
        <TimeUnit selected={time.unit} setUnit={setUnit} />
        <button onclick={remove}>Remove</button>
    </div>
);

const view = state => actions => (
    <section>
        <h1>Intervals</h1>
        <div>
            {state.times.map((time, index) => (
                <Time
                    time={time}
                    setValue={value => actions.setValue({ value, index })}
                    setUnit={unit => actions.setUnit({ unit, index })}
                    remove={() => actions.removeEntry(index)}
                />
            ))}
            <div>
                <button onclick={actions.addEntry}>Add</button>
            </div>
            <div>
                <button onclick={actions.save}>Save</button>
            </div>
        </div>
    </section>
);

export default view;
