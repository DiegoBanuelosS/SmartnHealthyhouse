const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { isMobileLayout, outlineOpacity, shouldStartPlayback } = require("../web/not-ready/pageState");

test("the landing layout switches at the mobile width", () => {
    assert.equal(isMobileLayout(768), true);
    assert.equal(isMobileLayout(320), true);
    assert.equal(isMobileLayout(769), false);
    assert.equal(isMobileLayout("700"), true);
});

test("ecosystem outlines fade only while that section is visible", () => {
    assert.equal(outlineOpacity(true), "0");
    assert.equal(outlineOpacity(false), "0.3");
});

test("the landing animation plays once when it enters view", () => {
    assert.equal(shouldStartPlayback(false, true), true);
    assert.equal(shouldStartPlayback(true, true), false);
    assert.equal(shouldStartPlayback(false, false), false);
});
