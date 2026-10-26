const { EventEmitter } = require("node:events");

function createFakeMqtt() {
    const clients = [];

    function connect(options) {
        const client = new EventEmitter();
        client.options = options;
        client.subscriptions = [];
        client.ended = false;
        client.subscribe = (topic, callback) => {
            client.subscriptions.push(topic);
            if (callback) callback(null);
        };
        client.end = () => {
            client.ended = true;
        };
        clients.push(client);
        return client;
    }

    return { connect, clients };
}

module.exports = { createFakeMqtt };
