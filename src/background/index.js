import { getStoredDurations, saveStoredDurations } from './storage/durations';
import { getDefaultResetOnInteraction, saveDefaultResetOnInteraction } from './storage/interaction';
import { getPageTimers, addPageTimer, removePageTimer, savePageTimers } from './storage/timers';
import * as Messages from '../messages';
import { showTime } from '../utils';
import normalizeURL from '../utils/normalizeURL';

const { menus, pageAction, runtime, sessions, tabs } = browser;

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
        type: Messages.CancelInteractionListener,
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
        this.pageTimers = null;
        this.tstRegistered = false;
    }

    async init() {
        this.defaultResetOnInteraction = await getDefaultResetOnInteraction();
        this.pageTimers = await getPageTimers();
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
        runtime.onMessage.addListener(this.onMessage.bind(this));
    }

    onMessage(message, sender, sendResponse) {
        switch (message.type) {
        // From popup
        case Messages.SetRefreshInterval:
            this.setRefreshInterval(message.tabId, message.duration);
            break;
        case Messages.GetTabResetOnInteraction: {
            const { resetOnInteraction } = this.getTab(message.tabId);
            sendResponse(resetOnInteraction);
            break;
        }
        case Messages.SetTabRefreshOnInteraction: {
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
        case Messages.GetSavedTimerForURL: {
            const { url } = message;
            const saved = this.getSavedTimer(url);
            sendResponse(saved);
            break;
        }
        case Messages.SaveTimer: {
            const { tabId, url } = message;
            const { duration, resetOnInteraction } = this.getTab(tabId);
            this.saveTimer(url, { duration, resetOnInteraction });
            break;
        }
        case Messages.RemoveSavedTimer: {
            const { url } = message;
            this.removePageTimer(url);
            break;
        }
        // From content script
        case Messages.PageInteraction: {
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
        // Storage
        case Messages.GetDefaultResetOnInteraction:
            sendResponse(this.defaultResetOnInteraction);
            break;
        case Messages.SaveDefaultResetOnInteraction: {
            const { defaultResetOnInteraction } = message;
            this.defaultResetOnInteraction = defaultResetOnInteraction;
            saveDefaultResetOnInteraction(defaultResetOnInteraction);
            break;
        }
        case Messages.GetDurationList:
            sendResponse(this.durations);
            break;
        case Messages.SaveDurationList: {
            const { durations } = message;
            this.durations = durations;
            this.makeMenus();
            saveStoredDurations(durations);
            break;
        }
        case Messages.GetPageTimers:
            sendResponse(this.pageTimers);
            break;
        case Messages.SavePageTimers: {
            const { pageTimers } = message;
            this.pageTimers = pageTimers;
            savePageTimers(pageTimers);
            break;
        }
        }
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
        } else {
            // Restore persistent timers
            this.restoreTimer(id);
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

    getSavedTimer(url) {
        return this.pageTimers[normalizeURL(url)];
    }

    async saveTimer(url, timer) {
        const normalized = normalizeURL(url);
        this.pageTimers[normalized] = timer;
        await addPageTimer(normalized, timer);
    }

    async removePageTimer(url) {
        const normalized = normalizeURL(url);
        delete this.pageTimers[normalized];
        await removePageTimer(normalized);
    }

    async restoreTimer(tabId) {
        if (this.tabIsRegistered(tabId)) {
            return;
        }
        let timer = null;
        const refresh = await sessions.getTabValue(tabId, 'refresh');
        if (refresh) {
            timer = refresh;
        } else {
            const { url } = await tabs.get(tabId);
            const saved = this.getSavedTimer(url);
            if (saved) {
                timer = saved;
            }
        }
        if (timer) {
            const { duration, resetOnInteraction } = timer;
            const isValid = typeof duration === 'number' && duration !== 0;
            if (isValid) {
                this.setRefreshInterval(tabId, duration, resetOnInteraction);
            }
        }
    }

    async restoreTimers() {
        await Promise.all((await tabs.query({})).map(tab => this.restoreTimer(tab.id)));
    }
}

new AutoRefresh().init();
