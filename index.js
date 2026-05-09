const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus
} = require('@discordjs/voice');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const VOICE_CHANNEL_ID = '1500459025865642005';

// Detect links
const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(discord\.gg\/[^\s]+)/gi;

// ================= VOICE SYSTEM =================

async function connectToVoice() {

    try {

        const channel = await client.channels.fetch(VOICE_CHANNEL_ID);

        if (!channel) {
            return console.log('❌ Voice channel not found');
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        console.log('🎤 Bot joined voice');

        // Reconnect system
        connection.on(VoiceConnectionStatus.Disconnected, async () => {

            try {

                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);

            } catch {

                console.log('🔄 Reconnecting voice...');

                connection.destroy();

                setTimeout(() => {
                    connectToVoice();
                }, 3000);
            }
        });

    } catch (err) {
        console.error(err);
    }
}

// ================= READY =================

client.once('clientReady', async () => {

    console.log(`✅ Logged in as ${client.user.tag}`);

    connectToVoice();
});

// ================= AUTO KICK =================

client.on('voiceStateUpdate', async (oldState, newState) => {

    if (
        newState.channelId === VOICE_CHANNEL_ID &&
        !newState.member.user.bot
    ) {

        try {

            await newState.disconnect();

            console.log(`🚫 ${newState.member.user.tag} got kicked`);

        } catch (err) {
            console.error(err);
        }
    }
});

// ================= ANTI LINK =================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // Ignore admins
    if (
        message.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) return;

    // Detect links
    if (linkRegex.test(message.content)) {

        try {

            // Delete message
            await message.delete();

            // Warning message
            const warn = await message.channel.send({
                content: `⚠️ ${message.author} ta3rafch 7ram 3aych weldi`
            });

            // Delete warning after 5 sec
            setTimeout(() => {
                warn.delete().catch(() => { });
            }, 5000);

            console.log(`🚫 Link deleted from ${message.author.tag}`);

        } catch (err) {
            console.error(err);
        }
    }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const PREFIX = "!";

    // ================= LOCK ROOM =================

    if (message.content === "!saker_room") {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return;
        }

        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: false
            }
        );

        return message.channel.send("🔒 room تسكرت");
    }

    // ================= OPEN ROOM =================

    if (message.content === "!hel_room") {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return;
        }

        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: true
            }
        );

        return message.channel.send("🔓 room تحلت");
    }

    // ================= ANTI LINK =================

    if (
        message.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) return;

    if (linkRegex.test(message.content)) {

        try {

            await message.delete();

            const warn = await message.channel.send({
                content: `⚠️ ${message.author} ta3rafch 7ram 3aych weldi`
            });

            setTimeout(() => {
                warn.delete().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error(err);
        }
    }
});