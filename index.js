const { Client, GatewayIntentBits, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Create Express app for health monitoring
const app = express();
const PORT = process.env.PORT || 3000;

// Health endpoint for monitoring services
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot_status: client.isReady() ? 'online' : 'offline'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot_status: client.isReady() ? 'online' : 'offline'
    });
});

// Start the health server
app.listen(PORT, () => {
    console.log(`Health server running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
});

// Self-ping to prevent sleeping (backup method)
const keepAlive = () => {
    setInterval(() => {
        if (process.env.NODE_ENV === 'production' && process.env.RENDER_SERVICE_URL) {
            fetch(`${process.env.RENDER_SERVICE_URL}/health`)
                .then(response => {
                    console.log(`Self-ping successful: ${response.status}`);
                })
                .catch(error => {
                    console.error('Self-ping failed:', error.message);
                });
        }
    }, 14 * 60 * 1000); // Every 14 minutes
};

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Configuration - Load from environment variables
const LOWBALL_CHANNEL_ID = process.env.LOWBALL_CHANNEL_ID;
const AUTO_DELETE_CHANNEL_ID = process.env.AUTO_DELETE_CHANNEL_ID; // New channel for auto-deleting non-admin messages
const LOWBALL_ROLE_NAME = process.env.LOWBALL_ROLE_NAME || 'lowball'; // Default role name

// When the client is ready, run this code
client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    // Start keep-alive mechanism
    keepAlive();
    console.log('Keep-alive mechanism started');
    
    // Register ALL slash commands here
    const commands = [
        // Lowball command
        new SlashCommandBuilder()
            .setName('lowballmethod')
            .setDescription('Submit a car for lowballing'),
        
        // Ping command (simple example)
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Check if the bot is working'),
        
        // Help command
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show all available commands'),
        
        // Clear command (deletes messages)
        new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clear messages from this channel')
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('Number of messages to delete (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            ),
        
        // User info command
        new SlashCommandBuilder()
            .setName('userinfo')
            .setDescription('Get information about a user')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to get info about')
                    .setRequired(false)
            ),
        
        // Say command (bot repeats what you type)
        new SlashCommandBuilder()
            .setName('say')
            .setDescription('Make the bot say something')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('What you want the bot to say')
                    .setRequired(true)
            ),
        
        // Purge command (delete messages from non-admins)
        new SlashCommandBuilder()
            .setName('purge')
            .setDescription('Delete all messages from users without admin role')
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('Number of messages to check (1-100, default: 50)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(100)
            ),
        
        // NEW: Reaction roles setup command
        new SlashCommandBuilder()
            .setName('setup-reaction-roles')
            .setDescription('Setup reaction roles for the lowball role (Admin only)')
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('Title for the reaction role message')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description for the reaction role message')
                    .setRequired(false)
            )
    ];

    try {
        for (const command of commands) {
            await client.application.commands.create(command);
        }
        console.log('All slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // LOWBALL METHOD COMMAND
    if (interaction.commandName === 'lowballmethod') {
        // Create modal for input
        const modal = new ModalBuilder()
            .setCustomId('lowball_modal')
            .setTitle('Lowball Method Submission');

        // Create text inputs
        const carInput = new TextInputBuilder()
            .setCustomId('car_input')
            .setLabel('Car (e.g., 2011 BMW 3 Series)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        const priceInput = new TextInputBuilder()
            .setCustomId('price_input')
            .setLabel('Lowball Price')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(20);

        const linkInput = new TextInputBuilder()
            .setCustomId('link_input')
            .setLabel('Facebook Marketplace Link')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(500);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(carInput);
        const secondActionRow = new ActionRowBuilder().addComponents(priceInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(linkInput);

        // Add action rows to modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    }

    // PING COMMAND
    else if (interaction.commandName === 'ping') {
        await interaction.reply({ 
            content: `🏓 Pong! Bot is working fine. Ping: ${client.ws.ping}ms`, 
            ephemeral: true 
        });
    }

    // HELP COMMAND
    else if (interaction.commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Bot Commands')
            .setDescription('Here are all the commands you can use:')
            .addFields(
                { name: '/lowballmethod', value: 'Submit a car for lowballing', inline: false },
                { name: '/ping', value: 'Check if the bot is working', inline: false },
                { name: '/help', value: 'Show this help message', inline: false },
                { name: '/clear [amount]', value: 'Delete messages (1-100)', inline: false },
                { name: '/userinfo [user]', value: 'Get info about a user', inline: false },
                { name: '/say [message]', value: 'Make the bot say something', inline: false },
                { name: '/purge [amount]', value: 'Delete messages from users without admin role', inline: false },
                { name: '/setup-reaction-roles', value: 'Setup reaction roles for lowball role (Admin only)', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }

    // CLEAR COMMAND
    else if (interaction.commandName === 'clear') {
        const amount = interaction.options.getInteger('amount');
        
        // Check if user has permission to manage messages
        if (!interaction.member.permissions.has('ManageMessages')) {
            await interaction.reply({ 
                content: '❌ You need "Manage Messages" permission to use this command!', 
                ephemeral: true 
            });
            return;
        }

        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ 
                content: `✅ Deleted ${messages.size} messages!`, 
                ephemeral: true 
            });
        } catch (error) {
            await interaction.reply({ 
                content: '❌ I cannot delete messages older than 14 days!', 
                ephemeral: true 
            });
        }
    }

    // USER INFO COMMAND
    else if (interaction.commandName === 'userinfo') {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const userEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`👤 ${user.username}'s Information`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Account Created', value: user.createdAt.toDateString(), inline: true },
                { name: 'Joined Server', value: member ? member.joinedAt.toDateString() : 'Not in server', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [userEmbed], ephemeral: true });
    }

    // SAY COMMAND
    else if (interaction.commandName === 'say') {
        const message = interaction.options.getString('message');
        
        // Send the message to the channel
        await interaction.channel.send(message);
        
        // Confirm to the user privately
        await interaction.reply({ 
            content: '✅ Message sent!', 
            ephemeral: true 
        });
    }

    // PURGE COMMAND
    else if (interaction.commandName === 'purge') {
        const amount = interaction.options.getInteger('amount') || 50; // Default to 50 if not specified
        
        // Check if user has permission to manage messages
        if (!interaction.member.permissions.has('ManageMessages')) {
            await interaction.reply({ 
                content: '❌ You need "Manage Messages" permission to use this command!', 
                ephemeral: true 
            });
            return;
        }

        try {
            // Defer the reply since this might take time
            await interaction.deferReply({ ephemeral: true });

            // Fetch messages from the channel
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            
            // Filter messages from users WITHOUT admin role
            const messagesToDelete = messages.filter(message => {
                // Skip bot messages
                if (message.author.bot) return false;
                
                const member = interaction.guild.members.cache.get(message.author.id);
                if (!member) return true; // Delete if member not found
                
                // Check if user has admin role or admin permissions
                const hasAdminRole = member.roles.cache.some(role => 
                    role.name.toLowerCase() === 'admin' || 
                    role.name.toLowerCase() === 'administrator'
                );
                const hasAdminPermission = member.permissions.has('Administrator');
                
                // Delete message if user doesn't have admin role AND doesn't have admin permission
                return !hasAdminRole && !hasAdminPermission;
            });

            if (messagesToDelete.size === 0) {
                await interaction.editReply({ 
                    content: `❌ No messages found from non-admin users in the last ${amount} messages.`
                });
                return;
            }

            // Delete the messages
            let deletedCount = 0;
            let skippedCount = 0;
            
            for (const message of messagesToDelete.values()) {
                try {
                    // Check if message is older than 14 days (Discord limitation)
                    const messageAge = Date.now() - message.createdTimestamp;
                    if (messageAge < 14 * 24 * 60 * 60 * 1000) { // 14 days in milliseconds
                        await message.delete();
                        deletedCount++;
                        // Add small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } else {
                        skippedCount++;
                    }
                } catch (error) {
                    console.error('Error deleting message:', error);
                    skippedCount++;
                }
            }

            let resultMessage = `✅ Deleted ${deletedCount} messages from non-admin users.`;
            if (skippedCount > 0) {
                resultMessage += `\n⚠️ Skipped ${skippedCount} messages (too old or couldn't delete).`;
            }

            await interaction.editReply({ content: resultMessage });

        } catch (error) {
            console.error('Error in purge command:', error);
            await interaction.editReply({ 
                content: '❌ There was an error purging messages. Make sure I have permission to delete messages in this channel.'
            });
        }
    }

// NEW: SETUP REACTION ROLES COMMAND
else if (interaction.commandName === 'setup-reaction-roles') {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({ 
            content: '❌ You need Administrator permission to use this command!', 
            ephemeral: true 
        });
        return;
    }

    try {
        // Find the lowball role first
        const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === LOWBALL_ROLE_NAME.toLowerCase());
        
        if (!role) {
            await interaction.reply({ 
                content: `❌ Could not find the "${LOWBALL_ROLE_NAME}" role. Please make sure it exists first!`, 
                ephemeral: true 
            });
            return;
        }

        // Get custom title and description, or use defaults
        const title = interaction.options.getString('title') || 'Facebook Lowball Method';
        const description = interaction.options.getString('description') || 
            'Use the green button below to claim your role. Use the red one if you got the role but then decided to remove it or if you don\'t want to get pings from it.';

        // Create embed with proper role mention
        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle(title)
            .setDescription(`${description}\n\n<@&${role.id}>\n\nUse the button below!`)
            .setTimestamp();

        // Create buttons
        const addRoleButton = new ButtonBuilder()
            .setCustomId('add_lowball_role')
            .setLabel('Add the role!')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⭐');

        const removeRoleButton = new ButtonBuilder()
            .setCustomId('remove_lowball_role')
            .setLabel('Remove role / No more pings')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const actionRow = new ActionRowBuilder()
            .addComponents(addRoleButton, removeRoleButton);

        // Send the message
        await interaction.channel.send({
            embeds: [embed],
            components: [actionRow]
        });

        await interaction.reply({ 
            content: '✅ Reaction roles message has been set up successfully!', 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Error setting up reaction roles:', error);
        await interaction.reply({ 
            content: '❌ There was an error setting up reaction roles. Please try again.', 
            ephemeral: true 
        });
    }
}
});

// Handle button interactions for reaction roles
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Handle lowball role buttons
    if (interaction.customId === 'add_lowball_role' || interaction.customId === 'remove_lowball_role') {
        try {
            // Find the lowball role
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === LOWBALL_ROLE_NAME.toLowerCase());
            
            if (!role) {
                await interaction.reply({ 
                    content: `❌ Could not find the "${LOWBALL_ROLE_NAME}" role. Please make sure it exists and the bot can see it.`, 
                    ephemeral: true 
                });
                return;
            }

            const member = interaction.member;
            const hasRole = member.roles.cache.has(role.id);

            if (interaction.customId === 'add_lowball_role') {
                if (hasRole) {
                    await interaction.reply({ 
                        content: `❌ You already have the ${role.name} role!`, 
                        ephemeral: true 
                    });
                } else {
                    await member.roles.add(role);
                    await interaction.reply({ 
                        content: `✅ You have been given the ${role.name} role!`, 
                        ephemeral: true 
                    });
                }
            } else if (interaction.customId === 'remove_lowball_role') {
                if (!hasRole) {
                    await interaction.reply({ 
                        content: `❌ You don't have the ${role.name} role to remove!`, 
                        ephemeral: true 
                    });
                } else {
                    await member.roles.remove(role);
                    await interaction.reply({ 
                        content: `✅ The ${role.name} role has been removed from you!`, 
                        ephemeral: true 
                    });
                }
            }

        } catch (error) {
            console.error('Error handling role button:', error);
            await interaction.reply({ 
                content: '❌ There was an error processing your request. Please make sure the bot has permission to manage roles.', 
                ephemeral: true 
            });
        }
    }
});

// Handle modal submissions (for lowball method)
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'lowball_modal') {
        // Get the input values
        const car = interaction.fields.getTextInputValue('car_input');
        const price = interaction.fields.getTextInputValue('price_input');
        const link = interaction.fields.getTextInputValue('link_input');
        const user = interaction.user;

        try {
            // Get the channel to send the message to
            const channel = client.channels.cache.get(LOWBALL_CHANNEL_ID);
            
            if (!channel) {
                await interaction.reply({ 
                    content: 'Error: Could not find the designated lowball channel. Please contact an administrator.', 
                    ephemeral: true 
                });
                return;
            }

            // Create the formatted message
            const message = `||<@&1335332535835820135>||

# **Lowball this ${car}!**

This is a **${car}** for **<@${user.id}>** and you guys need to lowball the person for **${price}**. Here is the marketplace link **${<link>}**`;

            // Send the message to the designated channel
            await channel.send(message);

            // Reply to the user privately
            await interaction.reply({ 
                content: '✅ Your lowball request has been posted successfully!', 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error sending lowball message:', error);
            await interaction.reply({ 
                content: '❌ There was an error posting your lowball request. Please try again or contact an administrator.', 
                ephemeral: true 
            });
        }
    }
});

// Auto-delete messages from non-admins in specific channel
client.on('messageCreate', async message => {
    // Skip if it's a bot message
    if (message.author.bot) return;
    
    // Skip if it's not the auto-delete channel
    if (message.channel.id !== AUTO_DELETE_CHANNEL_ID) return;
    
    // Skip if no auto-delete channel is configured
    if (!AUTO_DELETE_CHANNEL_ID) return;
    
    try {
        const member = message.guild.members.cache.get(message.author.id);
        if (!member) {
            // Delete if member not found
            await message.delete();
            return;
        }
        
        // Check if user has admin role or admin permissions
        const hasAdminRole = member.roles.cache.some(role => 
            role.name.toLowerCase() === 'admin' || 
            role.name.toLowerCase() === 'administrator'
        );
        const hasAdminPermission = member.permissions.has('Administrator');
        
        // Delete message if user doesn't have admin role AND doesn't have admin permission
        if (!hasAdminRole && !hasAdminPermission) {
            await message.delete();
            console.log(`Auto-deleted message from ${message.author.username} in ${message.channel.name}`);
        }
        
    } catch (error) {
        console.error('Error auto-deleting message:', error);
    }
});

// Handle errors
client.on('error', error => {
    console.error('Discord client error:', error);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Export for testing purposes
module.exports = { client };
