require("dotenv").config();
const fs = require("fs");

const discord = require('discord.js');
const ytdl = require("ytdl-core-discord");

const play = require('./play/play');

var bot = new discord.Client();

bot.on('ready' , () => {
    console.log('bot on ' + bot.user.tag);
})

bot.on("message",  play.play);

bot.on("reconnecting", () => {
    console.log("reconnect");
})

bot.on("disconnecting" , ()=>{
    console.log("disconnect");
})

bot.login(process.env.TOKEN || 3000); 
