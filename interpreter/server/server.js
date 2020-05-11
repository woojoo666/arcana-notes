var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var port = process.env.PORT || 3000;

const ServerNodeMap = new Map();

var app = express();
	app.use(express.static(__dirname));
	app.get('/someGetRequest', function(req, res, next) {
	   console.log('receiving get request');
	});
	app.post('/somePostRequest', function(req, res, next) {
	   console.log('receiving post request');
	});
	app.listen(80); //port 80 need to run as root

	console.log("app listening on %d ", 80);

var server = http.createServer(app);
	server.listen(port);

console.log("http server listening on %d", port);

var userId;
var wss = new WebSocketServer({server: server});

wss.on("connection", function (ws) {
	console.info("websocket connection open");

	var timestamp = new Date().getTime();
	userId = timestamp;

	ws.send(JSON.stringify({msgType:"onOpenConnection", msg:{connectionId:timestamp}}));

	ws.on("message", function (data, flags) {
		console.log("websocket received a message");
		var clientMsg = data;

		ws.send(JSON.stringify({msg:{connectionId:userId}}));
	});

	ws.on("close", function () {
		console.log("websocket connection close");
	});
});

console.log("websocket server created");

function registerServerNode(route = 'index', serverNode) {
	if (ServerNodeMap.has(route)) {
		throw Error('cannot create multiple server nodes with the same route');
	}
	ServerNodeMap.set(route, serverNode);
}

module.exports = registerServerNode;
