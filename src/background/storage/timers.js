const { storage } = browser;

export const getSavedTimers = () =>
    storage.local.get({
        pageTimers: {}
    }).then(results => results.pageTimers);

export const addSavedTimer = async (url, timer) => {
    const pageTimers = await getSavedTimers();
    pageTimers[url] = timer;
    await storage.local.set({
        pageTimers
    });
};

export const removeSavedTimer = async url => {
    const pageTimers = await getSavedTimers();
    delete pageTimers[url];
    await storage.local.set({
        pageTimers
    });
};

export const saveSavedTimers = pageTimers =>
    storage.local.set({ pageTimers });
