const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { parseSocketUpdate, reconnectPlan } = require("../WWW/Dashboard/scripts/socketClient");

test("dashboard data keeps the socket payload and drops the envelope", () => {
    const message = { temperature: 21, humidity: 40, gas: false };
    assert.deepEqual(parseSocketUpdate({ topic: "esp32/sensor", message }), message);
    assert.equal(parseSocketUpdate(null), null);
    assert.equal(parseSocketUpdate(undefined), null);
    assert.equal(parseSocketUpdate("update"), null);
    assert.equal(parseSocketUpdate([]), null);
    assert.equal(parseSocketUpdate({ topic: "esp32/sensor" }), null);
    assert.equal(parseSocketUpdate({ message: "text" }), null);
    assert.equal(parseSocketUpdate({ message: [] }), null);
});

test("dashboard data reconnects until the attempt cap", () => {
    assert.deepEqual(reconnectPlan(0, 3), { shouldReconnect: true, attempts: 1 });
    assert.deepEqual(reconnectPlan(2, 3), { shouldReconnect: true, attempts: 3 });
    assert.deepEqual(reconnectPlan(3, 3), { shouldReconnect: false, attempts: 3 });
});
