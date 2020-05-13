import { getWSClientUtils } from './ws-utils.js';

console.log('opening websocket connection');
var ws = new WebSocket(`ws://${window.location.host}/`);

const { sendMessage, onMessage, onOpen } = getWSClientUtils(ws);

onOpen(() => {
	console.log('hello');
	sendMessage('heartbeat', { time: Date.now() });
});

onMessage('heartbeat-response', (data) => {
	console.log(`got heartbeat response at t=${data.time}`);
})
