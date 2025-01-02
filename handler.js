const { bot } = require("./bot.js");

module.exports.start = async (event) => {
    try {
        let body = event.body[0] === "{"
                ? JSON.parse(event.body)
                : JSON.parse(Buffer.from(event.body, "base64"));
        await bot.handleUpdate(body);
        return { statusCode: 200, body: "" };
    } catch (err) {
       // error handler
    }
};

module.exports.setWebhook = async (event) => {
    try {
        const url = `https://${event.headers.Host}/${event.requestContext.stage}/webhook`;
        await bot.telegram.setWebhook(url);
        return {
            statusCode: 200,
            headers: {"Access-Control-Allow-Origin": "*"},
            body: JSON.stringify({ url }),
        };
    } catch (err) {
    }
};
