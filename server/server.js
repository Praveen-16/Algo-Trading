const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000; // Use environment port or default to 5000

app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://praveen:Praveen%40163@cluster0.wv3dqcm.mongodb.net/time?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define a schema and model for storing timestamps
const timeSchema = new mongoose.Schema({
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const TimeRecord = mongoose.model('TimeRecord', timeSchema);

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

// Function to get current time in HH:mm format
const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0].slice(0, 5); // Format: HH:mm
};

// Send current time to all connected clients every minute
setInterval(async () => {
    const currentTime = getCurrentTime();
    const timeRecord = new TimeRecord({ time: currentTime });

    try {
        // Save the current time to the database
        await timeRecord.save();

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ currentTime }));
            }
        });
    } catch (error) {
        console.error('Error saving time to the database:', error);
    }
}, 60000); // Every 1 minute

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Retrieve the last 30 timestamps from the database when a client connects
    TimeRecord.find().sort({ createdAt: -1 }).limit(30).exec((err, records) => {
        if (err) {
            console.error('Error retrieving records:', err);
            return;
        }
        // Send the last 30 records to the client
        ws.send(JSON.stringify({ records }));
    });
});
