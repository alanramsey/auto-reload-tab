import * as Messages from './messages';

const { runtime } = browser;

const EVENT_TYPES = [
    'auxclick',
    'contextmenu',
    'click',
    'mousedown',
    'mouseup',
    'keydown',
    'keypress',
    'keyup',
];

// Prevent excessive IPC messaging
const THROTTLE_TIMEOUT = 100;

let g_IPCLock = false;

const listener = () => {
    if (!g_IPCLock) {
        runtime.sendMessage({
            type: Messages.PageInteraction,
        });
        g_IPCLock = true;
        window.setTimeout(() => {
            g_IPCLock = false;
        }, THROTTLE_TIMEOUT);
    }
};

const removeListeners = () => {
    for (const eventType of EVENT_TYPES) {
        document.removeEventListener(eventType, listener, true);
    }
};

for (const eventType of EVENT_TYPES) {
    document.addEventListener(eventType, listener, true);
}

runtime.onMessage.addListener((message) => {
    if (message.type === Messages.CancelInteractionListener) {
        removeListeners();
    }
});
