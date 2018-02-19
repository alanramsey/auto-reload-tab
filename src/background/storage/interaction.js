const { storage } = browser;

export const getDefaultResetOnInteraction = () =>
    storage.local.get({
        defaultResetOnInteraction: null,
    }).then(results => results.defaultResetOnInteraction);
