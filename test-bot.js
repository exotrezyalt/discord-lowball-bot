require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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
