console.log('opening websocket connection');
var ws = new WebSocket(`ws://${window.location.host}/`);

ws.addEventListener('error', function (msg) { console.log("error"); });
ws.addEventListener('open', function (msg) { console.log("websocket connection open"); });
ws.addEventListener('message', function (msg) { console.log(msg.data); });
