const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 5000;

app.use(cors());

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

let ltp = 100; // Initial LTP

// Function to randomly update LTP for demonstration
const updateLTP = () => {
    const randomChange = (Math.random() * 2 - 1).toFixed(2); // Random change between -1 and 1
    ltp = (parseFloat(ltp) + parseFloat(randomChange)).toFixed(2); // Update LTP
};

// Send LTP to all connected clients every second
setInterval(() => {
    updateLTP();
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ltp }));
        }
    });
}, 1000); // Every 1 second

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ ltp })); // Send initial LTP when client connects
});
