require('dotenv').config();

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = "!";
const linkRegex = /(https?:\/\/[^\s]+)/i;

// 🔊 READY + دخول voice
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) return;

  const channel = guild.channels.cache.find(
    c => c.name === "SERVER DEV BY SRAD" && c.isVoiceBased()
  );

  if (!channel) {
    console.log("❌ ما لقيتش الروم الصوتية");
    return;
  }

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  console.log("🎧 دخل للروم الصوتية");
});

// 🚫 منع الروابط + commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // 🚫 Anti-link
  if (linkRegex.test(message.content)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      try {
        await message.delete();
        await message.member.timeout(2 * 60 * 1000, "Sending links");

        message.channel.send("🚫 ممنوع إرسال روابط + تم إعطاؤك timeout");

        const logChannel = message.guild.channels.cache.find(c => c.name === "logs");
        if (logChannel) {
          logChannel.send(`⚠️ ${message.author.tag} أرسل رابط وتم معاقبته`);
        }

      } catch (err) {
        console.log(err);
      }
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // 🏓 ping
  if (cmd === "ping") {
    return message.reply("🏓 pong");
  }

  // 🗣️ say
  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("❌ اكتب كلام");
    return message.channel.send(text);
  }

  // 🎭 role
  if (cmd === "role") {
    const roleName = args.join(" ");
    if (!roleName) return message.reply("❌ اكتب اسم role");

    const role = message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return message.reply("❌ role موش موجود");

    try {
      await message.member.roles.add(role);
      message.reply("✅ تم إعطاء role");
    } catch {
      message.reply("❌ ما نجمش نعطي role (permissions)");
    }
  }

  // ℹ️ help
  if (cmd === "help") {
    return message.channel.send(`
📜 Commands:
!ping → اختبار
!say → يخلي البوت يقول كلام
!role → يعطيك role
🚫 links → timeout
    `);
  }
});

// 🚫 يمنع أي حد يدخل الروم الصوتية
client.on('voiceStateUpdate', (oldState, newState) => {
  const channelName = "SERVER DEV BY SRAD";

  const channel = newState.guild.channels.cache.find(
    c => c.name === channelName && c.isVoiceBased()
  );

  if (!channel) return;

  if (newState.channelId === channel.id && !newState.member.user.bot) {
    newState.disconnect("❌ هذا الروم للبوت فقط");
  }
});

// 🔐 login من .env
client.login(process.env.TOKEN);