import { DURATIONS } from './defaults';
import { showTime } from './utils';

const { menus, pageAction, runtime, sessions, storage, tabs } = browser;

const NAME = 'Auto Reload Tab';

const TST_ID = 'treestyletab@piro.sakura.ne.jp';

const showPageAction = (id, duration) => {
    pageAction.setIcon({
        path: 'icon-96.png',
        tabId: id
    });
    pageAction.setTitle({
        tabId: id,
        title: `${NAME} (${showTime(duration)})`,
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

const getDefaultResetOnInteraction = () =>
    storage.local.get({
        defaultResetOnInteraction: null,
    }).then(results => results.defaultResetOnInteraction);

const refreshInterval = (tabId, seconds) =>
    window.setInterval(() => {
        tabs.reload(tabId);
    }, seconds * 1000);

const addInteractionListener = tabId => {
    tabs.executeScript(tabId, {
        allFrames: true,
        file: '/content.js',
        matchAboutBlank: true,
    });
};

const cancelInteractionListener = tabId => {
    tabs.sendMessage(tabId, {
        type: 'cancel-interaction-listener',
    });
};

class AutoRefresh {
    constructor() {
        this.durations = [];
        this.defaultResetOnInteraction = null;
        // Maps tab ids to { intervalId, duration, resetOnInteraction }
        this.registeredTabs = new Map();
        // Maps menu entry ids to { duration }
        this.menuEntries = new Map();
        this.tstRegistered = false;
    }

    async init() {
        this.defaultResetOnInteraction = await getDefaultResetOnInteraction();
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
            title: 'Options',
            contexts: ['tab'],
            id: 'reload-options',
        });

        await this.addMenu({
            title: 'Off',
            contexts: ['tab'],
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
        tabs.onCreated.addListener(tab => this.restoreTimer(tab.id));
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
        runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
            case 'set-refresh-interval': // from popup
                this.setRefreshInterval(message.tabId, message.duration);
                break;
            case 'get-tab-reset-on-interaction': {
                const { resetOnInteraction } = this.getTab(message.tabId);
                sendResponse(resetOnInteraction);
                break;
            }
            case 'set-tab-refresh-on-interaction': {
                const { resetOnInteraction, tabId } = message;
                if (resetOnInteraction === null) {
                    cancelInteractionListener(tabId);
                } else {
                    const tab = this.getTab(tabId);
                    if (tab.resetOnInteraction === null) {
                        addInteractionListener(tabId);
                    }
                }
                this.setTab(tabId, {
                    resetOnInteraction
                });
                break;
            }
            case 'page-interaction': { // from content script
                const tabId = sender.tab.id;
                switch (this.getTab(tabId).resetOnInteraction) {
                case 'reset':
                    this.resetInterval(tabId);
                    break;
                case 'cancel':
                    this.unregisterTab(tabId);
                    break;
                default:
                }
                break;
            }
            }
        });
        storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                if (changes.hasOwnProperty('durations')) {
                    const durations = changes.durations.newValue;
                    if (validateDurations(durations)) {
                        this.durations = durations;
                        this.makeMenus();
                    }
                }
                if (changes.hasOwnProperty('defaultResetOnInteraction')) {
                    this.defaultResetOnInteraction = changes.defaultResetOnInteraction.newValue;
                }
            }
        });
    }

    menuClicked(info, tab) {
        const { menuItemId } = info;
        if (menuItemId === 'reload-options') {
            runtime.openOptionsPage();
        } else {
            const { id } = tab;
            const entry = this.menuEntries.get(menuItemId);
            const duration = entry ? entry.duration : null;
            this.setRefreshInterval(id, duration);
        }
    }

    setRefreshInterval(tabId, duration, resetOnInteraction) {
        if (resetOnInteraction === undefined) {
            resetOnInteraction = this.defaultResetOnInteraction;
        }
        const previous = this.getTab(tabId);
        if (previous) {
            window.clearInterval(previous.intervalId);
        }
        if (!duration) {
            this.unregisterTab(tabId);
            return;
        }
        if (!previous && resetOnInteraction) {
            addInteractionListener(tabId);
        }
        const intervalId = refreshInterval(tabId, duration);
        this.setTab(tabId, {
            intervalId,
            duration,
            resetOnInteraction: previous
                ? previous.resetOnInteraction
                : resetOnInteraction,
        });
        showPageAction(tabId, duration);
    }

    tabUpdated(id) {
        // Page actions are reset when the page is navigated
        const tabEntry = this.getTab(id);
        if (tabEntry) {
            showPageAction(id, tabEntry.duration);
            if (tabEntry.resetOnInteraction) {
                addInteractionListener(id);
            }
        }
    }

    resetInterval(tabId) {
        const entry = this.getTab(tabId);
        if (entry) {
            const { intervalId, duration } = entry;
            window.clearInterval(intervalId);
            const newIntervalId = refreshInterval(tabId, duration);
            this.setTab(tabId, { intervalId: newIntervalId });
        }
    }

    unregisterTab(id) {
        const tabEntry = this.getTab(id);
        if (tabEntry) {
            window.clearInterval(tabEntry.intervalId);
            cancelInteractionListener(id);
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

    setTab(tabId, tabSettings) {
        const updatedSettings = Object.assign({
            resetOnInteraction: this.defaultResetOnInteraction,
        }, this.getTab(tabId), tabSettings);
        sessions.setTabValue(tabId, 'refresh', updatedSettings);
        this.registeredTabs.set(tabId, updatedSettings);
    }

    deleteTab(tabId) {
        sessions.removeTabValue(tabId, 'refresh').catch(() => {});
        this.registeredTabs.delete(tabId);
    }

    tabIsRegistered(tabId) {
        return this.registeredTabs.has(tabId);
    }

    async restoreTimer(tabId) {
        const refresh = await sessions.getTabValue(tabId, 'refresh');
        if (refresh) {
            const { duration, resetOnInteraction } = refresh;
            const isValid = typeof duration === 'number' && duration !== 0;
            if (isValid && !this.tabIsRegistered(tabId)) {
                this.setRefreshInterval(tabId, duration, resetOnInteraction);
            }
        }
    }

    async restoreTimers() {
        await Promise.all((await tabs.query({})).map(tab => this.restoreTimer(tab.id)));
    }
}

new AutoRefresh().init();
