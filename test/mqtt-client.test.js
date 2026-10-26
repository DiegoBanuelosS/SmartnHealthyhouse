const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { createHouseApp, attachMqtt } = require("../API/server/server");
const { createFakeMqtt } = require("./fixtures/fakeMqtt");

async function withHouse(run) {
    const house = createHouseApp();
    await new Promise((resolve) => house.server.listen(0, "127.0.0.1", resolve));
    try {
        await run(house);
    } finally {
        house.io.close();
        await new Promise((resolve) => house.server.close(resolve));
    }
}

test("mqtt updates sensors and incidents without a broker", async () => {
    await withHouse(async (house) => {
        const fake = createFakeMqtt();
        const client = attachMqtt(house, {
            host: "broker.example",
            port: 8883,
            key: "key",
            cert: "cert",
            ca: "ca"
        }, fake.connect);

        assert.equal(fake.clients.length, 1);
        assert.equal(client.options.protocol, "mqtts");
        assert.equal(client.options.host, "broker.example");
        assert.equal(client.options.rejectUnauthorized, true);

        const port = house.server.address().port;
        client.emit("connect");
        assert.deepEqual(client.subscriptions, ["testeo", "/testeo", "esp32/sensor", "/report-incident"]);

        let health = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal((await health.json()).mqtt, "connected");

        client.emit("message", "esp32/sensor", Buffer.from(JSON.stringify({
            temperatura: 22,
            humedad: 40
        })));
        assert.equal(house.state.sensorData.temperatura, 22);
        assert.equal(house.state.sensorData.humedad, 40);

        client.emit("message", "/report-incident", Buffer.from(JSON.stringify({
            title: "Gas",
            success: false,
            date: "2026-10-26"
        })));
        assert.equal(house.state.systemStatus.incidents[0].title, "Gas");
        assert.equal(house.state.systemStatus.incidents[0].date, "2026-10-26");

        client.emit("message", "/report-incident", Buffer.from("not-json"));
        client.emit("message", "esp32/sensor", Buffer.from("{"));
        assert.equal(house.state.systemStatus.incidents.length, 1);
        assert.equal(house.state.sensorData.temperatura, 22);

        client.emit("error", new Error("broker down"));
        health = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal((await health.json()).mqtt, "error");

        client.emit("close");
        health = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal((await health.json()).mqtt, "closed");
    });
});
