require('dotenv').config();
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");

const {
    TWITCH_BOT_USERNAME,
    TWITCH_OAUTH_TOKEN,
    TWITCH_CHANNEL,
    OPENAI_API_KEY,
} = process.env;

const twitchOpts = {
    options: {
        debug: true,
        messagesLogLevel: "info" },
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

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const openaiParams = {
    model: 'text-davinci-002',
    max_tokens: 150,
    temperature: 0.7,
    frequency_penalty: 0,
    presence_penalty: 0,
    user: 'twitch_chatbot'
};

const maxResponseLength = 500;

const client = new tmi.client(twitchOpts);

client.on('connected', (address, port) => {
    console.log(`Bot connected to ${address}:${port}`);
});

client.on('message', async (channel, tags, message, self) => {
    if (self) { return; }

    const botUsername = twitchOpts.identity.username.toLowerCase();

    // Just answer if it mentions the bot
    if (!message.toLowerCase().includes(`@${botUsername}`)) { return; }

    // Extract the prompt
    const prompt = message.replace(new RegExp(`@${botUsername}\\s*`), '');

    const completion = await openai.createCompletion({
        ...openaiParams,
        prompt
    })

    const response = completion.data.choices[0].text.trim();

    // Add user mention
    const mentionedResponse = `@${tags.username}, ${response}`;

    // Limit the response length
    const limitedResponse = mentionedResponse.slice(0, maxResponseLength);

    // Send the response back to the chat
    client.say(channel, limitedResponse);
});

// Connect to Twitch
client.connect();
