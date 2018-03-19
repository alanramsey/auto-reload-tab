const { storage } = browser;

export const getPageTimers = () =>
    storage.local.get({
        pageTimers: {}
    }).then(results => results.pageTimers);

export const addPageTimer = async (url, timer) => {
    const pageTimers = await getPageTimers();
    pageTimers[url] = timer;
    await storage.local.set({
        pageTimers
    });
};

export const removePageTimer = async url => {
    const pageTimers = await getPageTimers();
    delete pageTimers[url];
    await storage.local.set({
        pageTimers
    });
};

export const savePageTimers = pageTimers =>
    storage.local.set({ pageTimers });
