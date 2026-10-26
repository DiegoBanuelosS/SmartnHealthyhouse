function emit(level, message, fields = {}) {
    const entry = {
        time: new Date().toISOString(),
        level,
        message: message instanceof Error ? message.message : String(message),
        ...fields
    };
    const line = JSON.stringify(entry);
    if (level === "error" || level === "warn") console.error(line);
    else console.log(line);
    return entry;
}

function info(message, fields) {
    return emit("info", message, fields);
}

function warn(message, fields) {
    return emit("warn", message, fields);
}

function error(message, fields) {
    return emit("error", message, fields);
}

const api = { info, warn, error };

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.HouseLog = api;
}
