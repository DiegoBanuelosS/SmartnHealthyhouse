function formatClock(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function wheelDirection(deltaY, elapsedMs) {
    if (!(elapsedMs > 500)) return null;
    if (!(Math.abs(Number(deltaY)) > 30)) return null;
    return deltaY > 0 ? "down" : "up";
}

function scrollPace(scrollCount, elapsedMs) {
    if (elapsedMs < 300) return "fast";
    if (scrollCount > 4) return "burst";
    return "ok";
}

function arrowDirection(key, panel) {
    const grid = Boolean(panel && panel.isGridVisible);
    const third = Boolean(panel && panel.isThirdPanelVisible);
    if (key === "ArrowDown") {
        if (!grid && !third) return "down";
        if (grid && !third) return "down";
        return null;
    }
    if (key === "ArrowUp") {
        if (third || grid) return "up";
        return null;
    }
    return null;
}

function nextPanel(panel, direction) {
    const grid = Boolean(panel && panel.isGridVisible);
    const third = Boolean(panel && panel.isThirdPanelVisible);
    if (direction === "down" && !grid && !third) {
        return { isGridVisible: true, isThirdPanelVisible: false };
    }
    if (direction === "down" && grid && !third) {
        return { isGridVisible: false, isThirdPanelVisible: true };
    }
    if (direction === "up" && third) {
        return { isGridVisible: true, isThirdPanelVisible: false };
    }
    if (direction === "up" && grid) {
        return { isGridVisible: false, isThirdPanelVisible: false };
    }
    return { isGridVisible: grid, isThirdPanelVisible: third };
}

const api = { formatClock, wheelDirection, scrollPace, arrowDirection, nextPanel };

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.HouseView = api;
}
