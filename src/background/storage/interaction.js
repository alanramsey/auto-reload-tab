const { storage } = browser;

export const getDefaultResetOnInteraction = () =>
    storage.local.get({
        defaultResetOnInteraction: null,
    }).then(results => results.defaultResetOnInteraction);

export const saveDefaultResetOnInteraction = defaultResetOnInteraction =>
    storage.local.set({ defaultResetOnInteraction });
