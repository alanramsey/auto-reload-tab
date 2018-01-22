import { DURATIONS } from '../defaults';
import { showTime } from '../utils';

import './style.css';

const { permissions, runtime, sessions, storage, tabs } = browser;

const RESET_DESCRIPTION = `If this is checked, the timer will be reset to zero
when you click or type anywhere on the page`.replace('\n', ' ');

const CANCEL_DESCRIPTION = `If this is checked, the timer will be turned off
when you click or type anywhere on the page`.replace('\n', ' ');

const compareNumbers = (x, y) => {
    if (x < y) {
        return -1;
    }
    if (y < x) {
        return 1;
    }
    return 0;
};

const handleSelected = (duration, tabId) => {
    runtime.sendMessage({
        type: 'set-refresh-interval',
        duration,
        tabId,
    });
    window.close();
};

const handleInteractionCheckbox = (resetOnInteraction, tabId) => {
    runtime.sendMessage({
        type: 'set-tab-refresh-on-interaction',
        resetOnInteraction,
        tabId,
    });
    window.close();
};

const optionsLink = () => {
    const li = document.createElement('li');
    li.className = 'menu-entry options-link';
    li.textContent = 'Options';
    li.addEventListener('click', () => {
        runtime.openOptionsPage();
    });
    return li;
};

const menuEntry = ({ duration, active, tabId }) => {
    const li = document.createElement('li');
    li.className = 'menu-entry';
    const radio = document.createElement('input');
    radio.className = 'menu-radio';
    radio.type = 'radio';
    radio.checked = active;
    radio.name = 'menu';
    const entryId = String(duration);
    radio.id = entryId;
    radio.addEventListener('click', () => handleSelected(duration, tabId));
    const label = document.createElement('label');
    label.className = 'menu-label';
    label.htmlFor = entryId;
    label.appendChild(radio);
    const labelText = duration ? showTime(duration) : 'Off';
    label.appendChild(document.createTextNode(labelText));
    li.appendChild(label);
    return li;
};

const checkbox = ({ action, active, description, tabId }) => {
    const li = document.createElement('li');
    li.className = 'menu-entry';
    li.title = description;
    const checkbox = document.createElement('input');
    checkbox.id = action;
    checkbox.type = 'checkbox';
    checkbox.checked = active;
    checkbox.addEventListener('click', () => {
        handleInteractionCheckbox(active ? null : action, tabId);
    });
    const label = document.createElement('label');
    label.htmlFor = action;
    label.appendChild(checkbox);
    const labelText =
        action === 'reset'
            ? 'Reset on interaction'
            : 'Disable on interaction';
    label.appendChild(document.createTextNode(labelText));
    li.appendChild(label);
    return li;
};

const resetOnInteractionCheckbox = (active, tabId) =>
    checkbox({
        action: 'reset',
        active,
        description: RESET_DESCRIPTION,
        tabId,
    });

const cancelOnInteractionCheckbox = (active, tabId) =>
    checkbox({
        action: 'cancel',
        active,
        description: CANCEL_DESCRIPTION,
        tabId,
    });

const main = async () => {
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    const refresh = await sessions.getTabValue(tab.id, 'refresh');
    const resetOnInteraction = await runtime.sendMessage({
        type: 'get-tab-reset-on-interaction',
        tabId: tab.id,
    });
    const allURLsPermission = await permissions.contains({
        origins: ['<all_urls>'],
    });
    const { durations } = await storage.local.get({ durations: DURATIONS });
    const activeDuration = refresh ? refresh.duration : null;
    if (activeDuration && !durations.includes(activeDuration)) {
        durations.push(activeDuration);
    }
    durations.sort(compareNumbers);
    const menu = document.createElement('ol');
    menu.className = 'menu';
    menu.appendChild(optionsLink());
    [null, ...durations]
        .map(duration =>
            menuEntry({
                duration,
                active: duration === activeDuration,
                tabId: tab.id,
            })
        )
        .forEach(entry => menu.appendChild(entry));
    if (allURLsPermission) {
        const resetCheckboxActive = resetOnInteraction === 'reset';
        menu.appendChild(resetOnInteractionCheckbox(resetCheckboxActive, tab.id));
        const cancelCheckboxActive = resetOnInteraction === 'cancel';
        menu.appendChild(cancelOnInteractionCheckbox(cancelCheckboxActive, tab.id));
    }
    document.body.appendChild(menu);
};

main();
