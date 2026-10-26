function isMobileLayout(width, maxWidth = 768) {
    return Number(width) <= maxWidth;
}

function outlineOpacity(isIntersecting) {
    return isIntersecting ? "0" : "0.3";
}

function shouldStartPlayback(alreadyPlayed, isIntersecting) {
    return !alreadyPlayed && Boolean(isIntersecting);
}

const api = { isMobileLayout, outlineOpacity, shouldStartPlayback };

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.PageState = api;
}
