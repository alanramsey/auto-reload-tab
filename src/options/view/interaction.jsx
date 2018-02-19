import { h } from 'hyperapp';

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
        <h3>Reset timer when interacting with page</h3>
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

export default ResetOnInteractionSection;
