import { getWSClientUtils } from './ws-utils.js';

console.log('opening websocket connection');
var ws = new WebSocket(`ws://${window.location.host}/`);

const { sendMessage, onMessage, onOpen } = getWSClientUtils(ws);

onOpen(() => {
	sendMessage('init');
});

onMessage('starter-pack', (data) => {
	console.log(data);
})
