import { DURATIONS } from './defaults';

const { menus, pageAction, runtime, sessions, storage, tabs } = browser;

const NAME = 'Auto Reload Tab';

const TST_ID = 'treestyletab@piro.sakura.ne.jp';

const showTime = totalSeconds => {
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds % (60 * 60) / 60);
    const hours = Math.floor(totalSeconds / (60 * 60));
    let s = '';
    if (hours > 0) {
        const plural = hours > 1 && 's' || '';
        s += `${hours} hour${plural}, `;
    }
    if (minutes > 0) {
        const plural = minutes > 1 && 's' || '';
        s += `${minutes} minute${plural}, `;
    }
    if (seconds > 0) {
        const plural = seconds > 1 && 's' || '';
        s += `${seconds} second${plural}`;
    }
    return s.replace(/, $/, '');
};

// Menus cannot be modified on a per-tab basis, so display tab state
// in a page action.
const showPageAction = (id, label) => {
    pageAction.setTitle({
        tabId: id,
        title: `Refreshing every ${label} (Click to disable)`
    });
    pageAction.setIcon({
        path: 'icon-96.png',
        tabId: id
    });
    pageAction.show(id);
};

const hidePageAction = id => {
    // pageAction.hide apparently doesn't work in Nightly 58
    pageAction.setTitle({
        tabId: id,
        title: `${NAME} (off)`
    });
    pageAction.setIcon({
        path: 'icon-disabled-96.png',
        tabId: id
    });
    pageAction.hide(id);
};

const orTimeout = (ms, promise) => Promise.race([
    promise,
    new Promise(resolve => window.setTimeout(resolve, ms))
]);

const sendTSTMessage = message =>
    orTimeout(100, runtime.sendMessage(TST_ID, message));

const registerTST = () => sendTSTMessage({
    type: 'register-self',
    name: NAME
}).catch(() => false);

const validateDurations = durations =>
    durations instanceof Array &&
    durations.length >= 1 &&
    durations.every(n => typeof n === 'number' && n > 0);

const getStoredDurations = async () => {
    const {durations} = await storage.local.get({
        durations: DURATIONS,
    });
    if (!validateDurations(durations)) {
        return DURATIONS;
    }
    return durations.filter(n => n > 0);
};

class AutoRefresh {
    constructor() {
        this.durations = [];
        // Maps tab ids to { intervalId, duration }
        this.registeredTabs = new Map();
        // Maps menu entry ids to { duration }
        this.menuEntries = new Map();
        this.tstRegistered = false;
    }

    async init() {
        await this.restoreTimers();
        window.setTimeout(() => {
            this.restoreTimers();
        }, 5000);
        this.tstRegistered = await registerTST();
        this.durations = await getStoredDurations();
        await this.makeMenus();
        this.listen();
    }

    async makeMenus() {
        this.menuEntries.clear();
        await menus.removeAll();
        if (this.tstRegistered) {
            await sendTSTMessage({
                type: 'fake-contextMenu-remove-all'
            });
        }

        await this.addMenu({
            title: 'Off',
            contexts: ['tab'],
            checked: true,
            id: 'reload-off'
        });

        for (const duration of this.durations) {
            const id = `reload-${duration}`;
            await this.addMenu({
                title: showTime(duration),
                contexts: ['tab'],
                id
            });
            this.menuEntries.set(id, { duration });
        }
    }

    listen() {
        menus.onClicked.addListener(this.menuClicked.bind(this));
        tabs.onRemoved.addListener(this.unregisterTab.bind(this));
        tabs.onUpdated.addListener(this.tabUpdated.bind(this));
        pageAction.onClicked.addListener(({id}) => this.unregisterTab(id));
        runtime.onMessageExternal.addListener(async (message, sender) => {
            if (sender.id === TST_ID) {
                switch (message.type) {
                case 'fake-contextMenu-click':
                    this.menuClicked(message.info, message.tab);
                    break;
                case 'ready':
                    this.tstRegistered = await registerTST();
                    await this.makeMenus();
                    break;
                }
            }
        });
        storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.hasOwnProperty('durations')) {
                const durations = changes.durations.newValue;
                if (validateDurations(durations)) {
                    this.durations = durations;
                    this.makeMenus();
                }
            }
        });
    }

    menuClicked(info, tab) {
        const { menuItemId } = info;
        const { id } = tab;
        this.unregisterTab(id);
        const entry = this.menuEntries.get(menuItemId);
        if (entry) {
            const { duration } = this.menuEntries.get(menuItemId);
            this.setRefreshInterval(id, duration);
        }
    }

    setRefreshInterval(tabId, duration) {
        const intervalId = window.setInterval(() => {
            tabs.reload(tabId);
        }, duration * 1000);
        this.setTab(tabId, intervalId, duration);
        const label = showTime(duration);
        showPageAction(tabId, label);
    }

    tabUpdated(id) {
        // Page actions are reset when the page is navigated
        const tabEntry = this.getTab(id);
        if (tabEntry) {
            const label = showTime(tabEntry.duration);
            showPageAction(id, label);
        }
    }

    unregisterTab(id) {
        const tabEntry = this.getTab(id);
        if (tabEntry) {
            window.clearInterval(tabEntry.intervalId);
            hidePageAction(id);
            this.deleteTab(id);
        }
    }

    async addMenu(params) {
        menus.create(params);
        if (this.tstRegistered) {
            await sendTSTMessage({
                type: 'fake-contextMenu-create',
                params
            }).catch(() => {});
        }
    }

    getTab(tabId) {
        return this.registeredTabs.get(tabId);
    }

    setTab(tabId, intervalId, duration) {
        sessions.setTabValue(tabId, 'refresh', { duration });
        this.registeredTabs.set(tabId, { intervalId, duration });
    }

    deleteTab(tabId) {
        sessions.removeTabValue(tabId, 'refresh').catch(() => {});
        this.registeredTabs.delete(tabId);
    }

    tabIsRegistered(tabId) {
        return this.registeredTabs.has(tabId);
    }

    async restoreTimers() {
        await Promise.all((await tabs.query({})).map(async tab => {
            const refresh = await sessions.getTabValue(tab.id, 'refresh');
            if (refresh) {
                const { duration } = refresh;
                if (!this.tabIsRegistered(tab.id)) {
                    this.setRefreshInterval(tab.id, duration);
                }
            }
        }));
    }
}

new AutoRefresh().init();
