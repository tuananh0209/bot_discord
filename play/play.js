const discord = require('discord.js');
const ytdl = require("ytdl-core-discord");

var bot = new discord.Client();

module.exports.play = async msg => {
    if (msg.content.slice(0, 2) === "!q") {
        msg.reply("Okay!");
        
        var url = msg.content.substr(3);
        console.log(url);

        async function play(connection) {
            console.log("12");

            const dispatch = connection.play(await ytdl(url), {
                type: "opus",
                filter: "audioonly"
            });

            dispatch.on("end", () => {
                connection.disconnect();
                console.log("end");
            })
        };
        const connection = await msg.member.voice.channel.join();
        play(connection);

    }
}
