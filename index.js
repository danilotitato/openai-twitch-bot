require('dotenv').config();
const tmi = require('tmi.js');

const {
  TWITCH_BOT_USERNAME,
  TWITCH_OAUTH_TOKEN,
  TWITCH_CHANNEL,
} = process.env;


const twitchOpts = {
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
      reconnect: true,
      secure: true
  },
  identity: {
    username: TWITCH_BOT_USERNAME,
    password: TWITCH_OAUTH_TOKEN,
  },
  channels: [TWITCH_CHANNEL],
};

const maxResponseLength = 500;

const client = new tmi.client(twitchOpts);

client.on('connected', (address, port) => {
  console.log(`Bot connected to ${address}:${port}`);
});

client.on('message', (channel, tags, message, self) => {
  if (self) { return; }

  const botUsername = twitchOpts.identity.username.toLowerCase();

  // Just answer if it mentions the bot
  if (!message.toLowerCase().includes(`@${botUsername}`)) { return; }

  client.say(channel, `Hi @${tags.username}!`);
});

// Connect to Twitch
client.connect();
