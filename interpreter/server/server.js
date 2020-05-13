import { getWSServerUtils } from './ws-utils.js';

var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var port = process.env.PORT || 3000;

let serverNode = null;

var app = express();
	app.use(express.static(__dirname));
	app.get('/:route', function (req, res, next) {
		const route = req.params.route;
		if (serverNode) {
			console.log('creating new clone of ServerNode')
		} else {
			res.status(404).send('No ServerNode exists at this route.');
		}
	});
	app.listen(80); //port 80 need to run as root

	console.log("app listening on %d ", 80);

var server = http.createServer(app);
	server.listen(port);

console.log("http server listening on %d", port);

var userId;
var wss = new WebSocketServer({server: server});

wss.on("connection", function (ws) {
	const { sendMessage, onMessage, onClose } = getWSServerUtils(ws);
		
	onClose(() => {
		console.log("websocket connection close");
	});

	onMessage('heartbeat', (data) => {
		console.log(`got heartbeat at t=${data.time}`);
		sendMessage('heartbeat-response', { time: Date.now() });
	})

});

console.log("websocket server created");

function registerServerNode(node) {
	serverNode = node;
	console.log('registered server');
}

export { registerServerNode };
