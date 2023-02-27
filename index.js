require('dotenv').config();
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");
const axios = require('axios');

const {
    TWITCH_BOT_USERNAME,
    TWITCH_OAUTH_TOKEN,
    TWITCH_CHANNEL,
    OPENAI_API_KEY,
    BANNED_WORDS_URL
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
    max_tokens: 500,
    temperature: 0.7,
    frequency_penalty: 0,
    presence_penalty: 0,
    user: 'twitch_chatbot',
    format: 'text'
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

    const bannedWords = await getBannedWords();

    // Extract the prompt
    const prompt = message.replace(new RegExp(`@${botUsername}\\s*`), '');

    for (let word of bannedWords) {
        if (prompt.toLowerCase().includes(word.toLowerCase())) {
            throw new Error(`Sorry, I cannot provide a response to that prompt. Please try something else.`);
        }
    }

    try {
        const completion = await openai.createCompletion({
            ...openaiParams,
            prompt
        })

        // Add user mention to the response
        const response = `@${tags.username}, ${completion.data.choices[0].text.trim()}`;

        for (let word of bannedWords) {
            if (response.toLowerCase().includes(word.toLowerCase())) {
                throw new Error(`Sorry, I cannot provide a response to that prompt. Please try something else.`);
            }
        }

        // Limit the response length
        if (response.length > maxResponseLength) {
            throw new Error('Sorry, I cannot provide a response that long. Please try a shorter prompt.');
        }

        // Send the response back to the chat
        client.say(channel, response);
    } catch (err) {
        console.error(err);
        client.say(channel, `@${tags.username}, ${err}`);
    }
});

// Connect to Twitch
client.connect();

const getBannedWords = async () => {
    try {
        const response = await axios.get(BANNED_WORDS_URL);
        const bannedWords = response.data.split('\n');
        return bannedWords;
    } catch (err) {
        throw new Error(`Can't load word filter`);
    }
}
