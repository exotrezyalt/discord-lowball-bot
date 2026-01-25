require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// Start Express server so Render doesn't kill the process
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ status: 'running', bot: client.isReady() ? 'online' : 'offline' });
});

app.listen(PORT, () => {
    console.log(`Health server running on port ${PORT}`);
});

// Now start the bot
console.log('Starting minimal bot test...');
console.log('Token exists:', !!process.env.DISCORD_TOKEN);
console.log('Token length:', process.env.DISCORD_TOKEN?.length);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
    console.log('✅✅✅ SUCCESS! Bot is ready!');
    console.log('Logged in as:', client.user.tag);
    console.log('Bot ID:', client.user.id);
});

client.on('error', (error) => {
    console.error('Client error:', error);
});

client.on('debug', (msg) => {
    console.log('[DEBUG]:', msg);
});

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Login promise resolved'))
    .catch((error) => {
        console.error('Login failed:', error);
        process.exit(1);
    });
