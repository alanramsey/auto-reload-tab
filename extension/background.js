const { menus, pageAction, sessions, tabs } = browser;

const count = (n, str) => n === 1 ? `1 ${str}` : `${n} ${str}s`;

const seconds = n => ({
    label: count(n, 'second'),
    duration: n * 1000
});

const minutes = n => ({
    label: count(n, 'minute'),
    duration: n * 1000 * 60
});

const hours = n => ({
    label: count(n, 'hour'),
    duration: n * 1000 * 60 * 60
});

const DURATIONS = [
    seconds(10),
    seconds(30),
    minutes(1),
    minutes(3),
    minutes(5),
    minutes(10),
    minutes(15),
    minutes(20),
    hours(1),
];

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
        title: 'Auto Reload Tab (off)'
    });
    pageAction.setIcon({
        path: 'icon-disabled-96.png',
        tabId: id
    });
    pageAction.hide(id);
};

class AutoRefresh {
    constructor() {
        // Maps tab ids to { intervalId, duration, label }
        this.registeredTabs = new Map();
        // Maps menu entry ids to { duration, label }
        this.menuEntries = new Map();
    }

    async init() {
        await this.restoreTimers();
        this.makeMenus();
        this.listen();
    }

    makeMenus() {
        menus.create({
            title: 'Off',
            contexts: ['tab'],
            checked: true,
        });

        for (const { duration, label } of DURATIONS) {
            const id = menus.create({
                title: label,
                contexts: ['tab'],
            });
            this.menuEntries.set(id, { duration, label });
        }
    }

    listen() {
        menus.onClicked.addListener(this.menuClicked.bind(this));
        tabs.onRemoved.addListener(this.unregisterTab.bind(this));
        tabs.onUpdated.addListener(this.tabUpdated.bind(this));
        pageAction.onClicked.addListener(({id}) => this.unregisterTab(id));
    }

    menuClicked(info, tab) {
        const { menuItemId } = info;
        const { id } = tab;
        this.unregisterTab(id);
        const entry = this.menuEntries.get(menuItemId);
        if (entry) {
            const { duration, label } = this.menuEntries.get(menuItemId);
            this.setRefreshInterval(id, duration, label);
        }
    }

    setRefreshInterval(tabId, duration, label) {
        const intervalId = window.setInterval(() => {
            tabs.reload(tabId);
        }, duration);
        this.setTab(tabId, intervalId, duration, label);
        showPageAction(tabId, label);
    }

    tabUpdated(id) {
        // Page actions are reset when the page is navigated
        const tabEntry = this.getTab(id);
        if (tabEntry) {
            showPageAction(id, tabEntry.label);
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

    getTab(tabId) {
        return this.registeredTabs.get(tabId);
    }

    setTab(tabId, intervalId, duration, label) {
        sessions.setTabValue(tabId, 'refresh', { duration, label });
        this.registeredTabs.set(tabId, { intervalId, duration, label });
    }

    deleteTab(tabId) {
        sessions.removeTabValue(tabId, 'refresh').catch(() => {});
        this.registeredTabs.delete(tabId);
    }

    async restoreTimers() {
        await Promise.all((await tabs.query({})).map(async tab => {
            const refresh = await sessions.getTabValue(tab.id, 'refresh');
            if (refresh) {
                const { duration, label } = refresh;
                this.setRefreshInterval(tab.id, duration, label);
            }
        }));
    }
}

new AutoRefresh().init();
