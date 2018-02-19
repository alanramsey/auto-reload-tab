import { h } from 'hyperapp';

const UNITS = ['seconds', 'minutes', 'hours'];

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

const TimeInput = ({ value, setValue }) => (
    <input
        class="browser-style duration-input"
        type="text"
        value={value === 0 ? '' : value}
        oninput={e => setValue(e.target.value)}
        oncreate={e => e.focus()}
    />
);

const Time = ({ time, remove, setUnit, setValue }) => (
    <div class="browser-style entry">
        <TimeInput value={time.value} setValue={setValue} />
        <TimeUnit selected={time.unit} setUnit={setUnit} />
        <button class="browser-style" onclick={remove}>
            Remove
        </button>
    </div>
);

export default Time;
