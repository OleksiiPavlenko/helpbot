// Import required modules from the Telegraf library and other necessary libraries
const { Telegraf, Markup, session } = require("telegraf");
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; // Define the scopes for Google Sheets API
const TOKEN_PATH = 'token.json'; // Path to store the OAuth token

// Initialize the bot with an empty session store
const store = {
    country: '',
    address: '',
    auth: null,
};
const token = ""; // Your bot token

const bot = new Telegraf(token); // Create a new Telegraf bot instance

// Use session middleware to manage user sessions
bot.use(session(store));

// Handle the '/start' command to initiate the conversation
bot.start((ctx) => {
    ctx.reply(`Hello, ${
            ctx.from.first_name ? ctx.from.first_name : ""
        }! Do you or your acquaintances need help? This applies within Ukraine`, Markup
            .keyboard(['YES', 'NO']) // Present two options to the user
            .oneTime()
            .resize()
    )
});

// Handle user response when they say 'YES'
bot.hears('YES', ctx => {
    ctx.telegram.sendMessage(ctx.message.chat.id, `Please specify the location that needs help`)
});

// Handle user response when they say 'NO'
bot.hears('NO', (ctx) => {
    ctx.session = {}; // Clear the session
    ctx.reply('Glory to Ukraine! To restart the bot, enter /start')
});

// Handle the '/exit' command to exit the bot
bot.command('/exit', (ctx) => {
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Glory to Ukraine! To restart the bot, enter /start')
    ctx.session = {}; // Clear the session
});

// Handle confirmation of the correct address
bot.hears('Correct', ctx => {
    ctx.telegram.sendMessage(ctx.message.chat.id, `Please specify the address. For example, Street 23`)
});

// Handle response when the address is incorrect
bot.hears('Incorrect', (ctx) => {
    ctx.session.country = ""; // Reset country in the session
    ctx.telegram.sendMessage(ctx.message.chat.id, `Please specify the location that needs help. For example, `)
});

// Handle confirmation that the address is correctly specified
bot.hears('Address is correct', ctx => {
    try {
        // Read credentials for Google Sheets API
        fs.readFile('credentials.json', (err, content) => {
            if (err) return; // Handle error
            // Authorize a client with credentials, then call the Google Sheets API
            authorize(JSON.parse(content), writeData);
        });

        // Function to authorize the client with Google API credentials
        function authorize(credentials, callback) {
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

            // Check if we have previously stored a token
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return getNewToken(oAuth2Client, callback); // If no token, get a new one
                oAuth2Client.setCredentials(JSON.parse(token));
                callback(oAuth2Client); // Call the callback function with the authorized client
            });
        }

        // Function to get a new token from Google API
        function getNewToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return console.error('Error while trying to retrieve access token', err);
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) return console.error(err);
                    });
                    callback(oAuth2Client); // Call the callback function with the authorized client
                });
            });
        }

        // Function to write data to Google Sheets
        function writeData(auth) {
            ctx.session.auth = auth; // Store authorized client in the session
            ctx.reply(`Is the full address specified correctly: ${ctx.session.country}, ${ctx.session.address}?`, Markup
                .keyboard(['I Confirm', 'I Do Not Confirm']) // Ask for confirmation
                .oneTime()
                .resize()
            )
        }
    } catch {
        ctx.session = {}; // Reset session on error
        ctx.telegram.sendMessage(ctx.message.chat.id, 'An error occurred! To restart the bot, enter /start')
        process.exit(1); // Exit the process on error
    }
});

// Handle the case when the address is incorrect
bot.hears('Address is incorrect', (ctx) => {
    ctx.session.address = ""; // Reset address in the session
    ctx.telegram.sendMessage(ctx.message.chat.id, `Please specify the address, for example, Victory Street 23`)
});

// Handle confirmation that the user does not confirm the address
bot.hears('I Do Not Confirm', (ctx) => {
    ctx.session.address = ""; // Reset address in the session
    ctx.session.country = ""; // Reset country in the session
    ctx.telegram.sendMessage(ctx.message.chat.id, `Please specify the city and address again`)
});

// Handle confirmation that the user confirms the address
bot.hears('I Confirm', (ctx) => {
    if (ctx.session && ctx.session.address) {
        const auth = ctx.session.auth; // Get the authorized client from the session
        var sheets = google.sheets({ version: 'v4', auth }); // Create a Google Sheets client
        let values = [
            [`${ctx.from.first_name} ${ctx.from.last_name}`, ctx.from.username, `Ukraine, ${ctx.session.country}, ${ctx.session.address}`, new Date().toLocaleString('en-US', {
                timeZone: 'Europe/Kiev' // Get the current date and time in the specified timezone
            })]
        ];
        const resource = {
            values, // Data to write to the spreadsheet
        };
        // Append data to the specified spreadsheet
        sheets.spreadsheets.values.append(
            {
                spreadsheetId: '', // Spreadsheet ID
                range: 'Sheet1', // Sheet name
                valueInputOption: 'RAW', // Input option for values
                resource: resource,
            },
            (err, result) => {
                if (err) {
                    // Handle error
                    ctx.telegram.sendMessage(ctx.message.chat.id, err);
                } else {
                    ctx.session = {}; // Clear session after successful submission
                    ctx.telegram.sendMessage(ctx.message.chat.id, 'Wait for help! Glory to Ukraine! To restart the bot, enter /start')
                }
            });
    }
});

// Handle any text message from the user
bot.on("text", (ctx) => {
    if (ctx.session && ctx.session.country && ctx.session.address) {
        return ctx.reply(`Is the full address specified correctly: ${ctx.session.country}, ${ctx.session.address}?`, Markup
            .keyboard(['I Confirm', 'I Do Not Confirm']) // Ask for confirmation
            .oneTime()
            .resize()
        )
    } else if (ctx.session && ctx.session.country) {
        ctx.session.address = ctx.message.text; // Save the address in the session
        return ctx.reply(`Is the address specified correctly: ${ctx.message.text}?`, Markup
            .keyboard(['Address is correct', 'Address is incorrect']) // Ask for confirmation of the address
            .oneTime()
            .resize()
        )
    } else {
        ctx.session = {}; // Reset session if no country is set
        ctx.session.country = ctx.message.text; // Save the country in the session
        return ctx.reply(`Is the specified location correct: ${ctx.message.text}?`, Markup
            .keyboard(['Correct', 'Incorrect']) // Ask for confirmation of the location
            .oneTime()
            .resize()
        )
    }
});

// Gracefully stop the bot on termination signals
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Launch the bot locally
bot.launch();
