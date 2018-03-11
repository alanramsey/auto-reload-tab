import normalizeURL from 'normalize-url';

export default url => {
    try {
        return normalizeURL(url);
    } catch (e) {
        return url;
    }
};
