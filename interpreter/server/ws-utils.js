function getWSClientUtils (ws) {
    const messageHandlers = new Map();
    let ON_OPEN_SPECIAL_KEY = {};

    // safe from race conditions because this is meant to be run client-side
    let socketOpen = false;

    ws.addEventListener('error', function (msg) {
        console.error("websocket error: " + msg);
    });
    ws.addEventListener('message', function (msg) {
        const { type, data } = JSON.parse(msg.data);
        const handlers = messageHandlers.get(type) || new Set();
        if (handlers.size > 0) {
            for (const listener of handlers) {
                listener(data);
            }
        } else {
            console.error(`message received with type ${type} but has no handlers`);
        }
    });
    ws.addEventListener('open', function () {
        socketOpen = true;
        const handlers = messageHandlers.get(ON_OPEN_SPECIAL_KEY) || new Set();
        if (handlers.size > 0) {
            for (const listener of handlers) {
                listener();
            }
            handlers.clear(); // don't need them anymore
        } else {
            console.error(`no handlers for socket open`);
        }
    });

    function sendMessage(type, data) {
        ws.send(JSON.stringify({type, data}));
    }

    function onMessage(type, callback) {
        if (!messageHandlers.has(type)) {
            messageHandlers.set(type, new Set());
        }
        messageHandlers.get(type).add(callback);
    }

    function onOpen (callback) {
        if (socketOpen) {
            callback();
        } else {
            onMessage(ON_OPEN_SPECIAL_KEY, callback);
        }
    }

    return { sendMessage, onMessage, onOpen };
};

function getWSServerUtils (ws) {
	console.info("websocket connection open");
    const messageHandlers = new Map();
    let ON_CLOSE_SPECIAL_KEY = {};

	ws.on("message", function (msg, flags) {
        const { type, data } = JSON.parse(msg);
        const handlers = messageHandlers.get(type) || new Set();
        if (handlers.size > 0) {
            for (const listener of handlers) {
                listener(data);
            }
        } else {
            console.error(`message received with type ${type} but has no handlers`);
        }
	});

	ws.on("close", function () {
		console.log("websocket connection close");
        const handlers = messageHandlers.get(ON_CLOSE_SPECIAL_KEY) || new Set();
        if (handlers.size > 0) {
            for (const listener of handlers) {
                listener();
            }
            handlers.clear(); // don't need them anymore
        } else {
            console.error(`no handlers for socket close`);
        }
    });

    function sendMessage(type, data) {
        ws.send(JSON.stringify({type, data}));
    }

    function onMessage(type, callback) {
        if (!messageHandlers.has(type)) {
            messageHandlers.set(type, new Set());
        }
        messageHandlers.get(type).add(callback);
    }

    function onClose (callback) {
        onMessage(ON_CLOSE_SPECIAL_KEY, callback);
    }

    return { sendMessage, onMessage, onClose };
}

export { getWSServerUtils, getWSClientUtils };
