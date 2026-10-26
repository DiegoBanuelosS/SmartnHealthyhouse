const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { info, warn, error } = require("../WWW/Dashboard/scripts/logger");

function capture(method, run) {
    const lines = [];
    const original = console[method];
    console[method] = (line) => lines.push(line);
    try {
        run();
    } finally {
        console[method] = original;
    }
    return JSON.parse(lines.at(-1));
}

test("the dashboard logger emits one json line", () => {
    const entry = capture("log", () => info("socket up", { attempt: 1 }));
    assert.equal(entry.level, "info");
    assert.equal(entry.message, "socket up");
    assert.equal(entry.attempt, 1);
    assert.equal(typeof entry.time, "string");
});

test("warnings and errors keep the message field", () => {
    const warning = capture("error", () => warn("retrying", { attempt: 2 }));
    assert.equal(warning.level, "warn");
    assert.equal(warning.message, "retrying");
    assert.equal(warning.attempt, 2);

    const failure = capture("error", () => error(new Error("closed"), { socket: "house" }));
    assert.equal(failure.level, "error");
    assert.equal(failure.message, "closed");
    assert.equal(failure.socket, "house");
});

test("the status page logs through the dashboard wrapper", () => {
    const source = fs.readFileSync("API/server/status/status.js", "utf8");
    assert.equal(source.includes("console.log"), false);
    assert.equal(source.includes("console.error"), false);
    assert.equal(source.includes("statusLog.info"), true);
    assert.equal(source.includes("statusLog.error"), true);
});
