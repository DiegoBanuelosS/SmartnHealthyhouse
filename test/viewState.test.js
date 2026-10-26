const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { formatClock, wheelDirection, scrollPace, arrowDirection, nextPanel } = require("../WWW/Dashboard/scripts/viewState");

test("the dashboard clock uses two digits", () => {
    assert.equal(formatClock(new Date(2026, 9, 26, 9, 5)), "09:05");
    assert.equal(formatClock(new Date(2026, 9, 26, 0, 0)), "00:00");
    assert.equal(formatClock(new Date(2026, 9, 26, 23, 59)), "23:59");
});

test("wheel input waits and ignores a short swipe", () => {
    assert.equal(wheelDirection(40, 500), null);
    assert.equal(wheelDirection(30, 501), null);
    assert.equal(wheelDirection(31, 501), "down");
    assert.equal(wheelDirection(-31, 800), "up");
});

test("arrow keys move only when another panel exists", () => {
    const home = { isGridVisible: false, isThirdPanelVisible: false };
    const grid = { isGridVisible: true, isThirdPanelVisible: false };
    const third = { isGridVisible: false, isThirdPanelVisible: true };
    assert.equal(arrowDirection("ArrowDown", home), "down");
    assert.equal(arrowDirection("ArrowDown", grid), "down");
    assert.equal(arrowDirection("ArrowDown", third), null);
    assert.equal(arrowDirection("ArrowUp", home), null);
    assert.equal(arrowDirection("ArrowUp", grid), "up");
    assert.equal(arrowDirection("ArrowUp", third), "up");
    assert.equal(arrowDirection("Enter", home), null);
    assert.deepEqual(nextPanel(home, "down"), grid);
    assert.deepEqual(nextPanel(grid, "down"), third);
    assert.deepEqual(nextPanel(third, "up"), grid);
    assert.deepEqual(nextPanel(grid, "up"), home);
    assert.deepEqual(nextPanel(third, "down"), third);
});

test("arrow repeats are fast and a burst is too many steps", () => {
    assert.equal(scrollPace(1, 299), "fast");
    assert.equal(scrollPace(5, 400), "burst");
    assert.equal(scrollPace(4, 400), "ok");
});
