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
const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});
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


// ================= LOGIN =================

client.login(process.env.TOKEN);
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

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
    SendMessages: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false
        }
    );

        await message.delete().catch(() => {});

        const msg = await message.channel.send("🔒 room تسكرت");

        setTimeout(() => {
            msg.delete().catch(() => {});
        }, 2000);

        return;
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
        SendMessages: true,
        CreatePublicThreads: true,
        CreatePrivateThreads: true
    }
);

        await message.delete().catch(() => {});

        const msg = await message.channel.send("🔓 room تحلت");

        setTimeout(() => {
            msg.delete().catch(() => {});
        }, 2000);

        return;
    }

    // Ignore admins

        // ================= AI CHAT =================

    if (message.content.startsWith("!ai")) {

        try {

            const question = message.content
                .replace("!ai", "")
                .trim();

            if (!question) {
                return message.reply("❌ اكتب سؤال");
            }

            const result = await model.generateContent(question);

            const response = result.response.text();

            message.reply(response);

                } catch (err) {

            console.error("GEMINI ERROR:", err);

            message.reply("❌ Gemini Error");
        }
    }
    if (
        message.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) return;

    // Detect links
    if (linkRegex.test(message.content)) {

        try {

            await message.delete();

            const warn = await message.channel.send({
                content: `⚠️ ${message.author} ta3rafch 7ram 3aych weldi`
            });

            setTimeout(() => {
                warn.delete().catch(() => {});
            }, 5000);

            console.log(`🚫 Link deleted from ${message.author.tag}`);

        } catch (err) {
            console.error(err);
        }
    }
     
});