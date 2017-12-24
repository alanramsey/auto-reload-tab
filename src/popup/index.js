import { DURATIONS } from '../defaults';
import { showTime } from '../utils';

import './style.css';

const { runtime, sessions, storage, tabs } = browser;

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

const main = async () => {
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    const refresh = await sessions.getTabValue(tab.id, 'refresh');
    const { durations } = await storage.local.get({ durations: DURATIONS });
    const activeDuration = refresh ? refresh.duration : null;
    if (activeDuration && !durations.includes(activeDuration)) {
        durations.push(activeDuration);
    }
    durations.sort(compareNumbers);
    const menu = document.createElement('ol');
    menu.className = 'menu';
    [null, ...durations]
        .map(duration =>
            menuEntry({
                duration,
                active: duration === activeDuration,
                tabId: tab.id,
            })
        )
        .forEach(entry => menu.appendChild(entry));
    document.body.appendChild(menu);
};

main();
