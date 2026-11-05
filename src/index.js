import "dotenv/config";
import { ApiClient } from "@twurple/api";
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";

const required = ["TWITCH_CLIENT_ID", "TWITCH_ACCESS_TOKEN", "TWITCH_BOT_USER_ID", "TWITCH_CHANNEL"];
for (const key of required) {
  if (!process.env[key]) throw new Error(\`Missing required environment variable: \${key}\`);
}

const clientId = process.env.TWITCH_CLIENT_ID;
const accessToken = process.env.TWITCH_ACCESS_TOKEN.replace(/^oauth:/, "");
const botUserId = process.env.TWITCH_BOT_USER_ID;
const channel = process.env.TWITCH_CHANNEL.replace(/^#/, "").toLowerCase();
const broadcasterUserId = process.env.TWITCH_BROADCASTER_USER_ID;

const authProvider = new StaticAuthProvider(clientId, accessToken, [
  "chat:read", "chat:edit", "moderator:manage:banned_users",
]);
const api = new ApiClient({ authProvider });
const chat = new ChatClient({ authProvider, channels: [channel] });
const shootCooldowns = new Map();
const SHOOT_COOLDOWN_MS = 60_000;

chat.onMessage(async (channelName, username, message, msg) => {
  const [command, ...args] = message.trim().split(/\\s+/);
  const cmd = command.toLowerCase();

  if (cmd === "!bucky") {
    await chat.say(channelName, "ARMED AND DANGEROUS");
    return;
  }
  if (cmd === "!help") {
    await chat.say(channelName, "Commands: !bucky, !shoot <username>, !lurk, !unlurk, !hug <username>, !coinflip, !8ball <question>");
    return;
  }
  if (cmd === "!lurk") {
    await chat.say(channelName, \`@\${username} has entered the shadows. Happy lurking!\`);
    return;
  }
  if (cmd === "!unlurk") {
    await chat.say(channelName, \`Welcome back, @\${username}!\`);
    return;
  }
  if (cmd === "!hug") {
    const recipient = cleanUsername(args[0]);
    if (!recipient) {
      await chat.say(channelName, \`@\${username}, tell me who to hug: !hug <username>\`);
      return;
    }
    await chat.say(channelName, \`@\${username} gives @\${recipient} a big hug!\`);
    return;
  }
  if (cmd === "!coinflip") {
    await chat.say(channelName, Math.random() < 0.5 ? "Heads!" : "Tails!");
    return;
  }
  if (cmd === "!8ball") {
    if (args.length === 0) {
      await chat.say(channelName, \`@\${username}, ask a question after !8ball.\`);
      return;
    }
    const answers = ["Absolutely.", "Signs point to yes.", "Probably not.", "The future is unclear.", "Ask again later.", "Without a doubt.", "I wouldn't count on it.", "Very likely."];
    await chat.say(channelName, answers[Math.floor(Math.random() * answers.length)]);
    return;
  }
  if (cmd !== "!shoot") return;

  const recipient = cleanUsername(args[0]);
  if (!recipient) {
    await chat.say(channelName, \`@\${username}, choose a target: !shoot <username>\`);
    return;
  }

  const executorId = msg.userInfo.userId;
  if (msg.userInfo.isBroadcaster || msg.userInfo.isMod) {
    await chat.say(channelName, "Mods and the broadcaster are protected from the prison mechanic.");
    return;
  }
  const now = Date.now();
  const lastUsed = shootCooldowns.get(executorId) ?? 0;
  if (now - lastUsed < SHOOT_COOLDOWN_MS) {
    await chat.say(channelName, \`@\${username}, your blaster is cooling down.\`);
    return;
  }
  if (recipient.toLowerCase() === username.toLowerCase()) {
    await chat.say(channelName, \`@\${username}, you cannot shoot yourself. Pick someone else!\`);
    return;
  }

  const broadcasterId = broadcasterUserId || (await api.users.getUserByName(channel))?.id;
  if (!broadcasterId) {
    await chat.say(channelName, "The prison system is unavailable right now.");
    console.error("Could not resolve broadcaster user ID.");
    return;
  }

  await chat.say(channelName, \`@\${username} just shot @\${recipient}, @\${recipient} is dead now.\`);
  try {
    // Only the person who ran !shoot is timed out. The named recipient is untouched.
    await api.moderation.banUser(broadcasterId, botUserId, executorId, {
      duration: 60,
      reason: "salxmm1 bot: !shoot roleplay timeout",
    });
    shootCooldowns.set(executorId, now);
  } catch (error) {
    console.error("Could not apply the !shoot timeout:", error);
    await chat.say(channelName, \`@\${username}, the roleplay worked, but Twitch prison couldn't be applied. Check the bot's moderator permissions.\`);
  }
});

function cleanUsername(value = "") {
  const username = value.replace(/^@/, "").trim();
  return /^[a-zA-Z0-9_]{1,25}$/.test(username) ? username : null;
}

chat.onConnect(() => console.log(\`Connected to Twitch chat: #\${channel}\`));
chat.onDisconnect((manually, reason) => console.log("Disconnected from Twitch chat.", { manually, reason }));
await chat.connect();
