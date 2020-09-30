const ytdl = require("ytdl-core");
const yts = require('yt-search');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require("fs");
require("dotenv").config();
var util = require("util");
const discord = require("discord.js");
const { DH_NOT_SUITABLE_GENERATOR } = require("constants");

const keyFile = 'textToSpeech/authClientAPIGoogle.json';
const projectId = process.env.PROJECTID;


var bot = new discord.Client();

const client = new textToSpeech.TextToSpeechClient({
    projectId,
    keyFile
});

const setting = {
    "audioConfig": {
        "audioEncoding": "LINEAR16",
        "pitch": 00,
        "speakingRate": 0.75,
        "sampleRateHertz": 16000
    },
    "input": {
        "text": ""
    },
    "voice": {
        "languageCode": "vi-VN",
        "name": "vi-VN-Standard-A"
    },
    "outputFileName": "output1.mp3"
}

console.log(projectId);


var playList = [];
var dispatch;
var connection;
var volume = 50;

async function play(connection , msg , begin ) {
        autoDisconnect(connection);
        var url = playList[0].url;

        // dispatch = connection.play(await ytdl(url) ,{
        //     filter: format => format.quanlity == "360p",
        //     begin: "10000ms",
        //     type: 'opus'
        // });
        // console.log(begin);
        dispatch = connection.play(await ytdl(url, { format: "audioonly" }), {
            seek: begin,
            fec: true,
            bitrate : "auto",
        });
        // console.log(dispatch.streamOptions);
        // console.log(playList);
        // console.log(playList);
        dispatch.setVolume(volume /100);
        

        dispatch.on('finish' , () => {  
            if (playList.length <= 1)
            {
                // console.log (dispatch.totalStreamTime / 1000);
                playList.shift();
                
            }
            else {
                playList.shift();
                // msg.channel.send(playList[0].title);
                // console.log(dispatch.totalStreamTime / 1000);
                play(connection , msg ,0 );
                
            }
        })

        dispatch.on("error", () =>{
            console.log("err");
        })

        dispatch.on("volumeChange" ,() => {
           
            console.log("change volume");
        })
};

function autoDisconnect(connection){
    setInterval(function(){
        connection.disconnect();
    }, 1000*60*60);
}

module.exports.play = async msg => {
    
    if (msg.author.bot || !msg.guild || !msg.content.startsWith("\\")) return;


    var i = msg.content.indexOf(' ');

    var key = msg.content.slice(0, i);
    // if (msg.content == "!tts") console.log("Ádasd");
    // console.log(msg.content);
    try{
    var order = msg.content.substr(i);
    }catch(err){
    var order = "a";
    }

    var urlCheck = order.indexOf("http");
    // console.log(msg.embeds[0].video);
    if (key == "\\q"){
        if (!connection) connection = await msg.member.voice.channel.join();
        
        var keyWord = urlCheck == -1 ? order : msg.embeds[0].title;
        var a = await yts(keyWord);
        var data = a.videos[0]; 
        // console.log(data);
        if (playList[0]){
            playList.push(data);
            msg.channel.send(data.title);
  
        }else{
            playList.push(data);
            play(connection , msg , 0);
            msg.channel.send("play!");
        }
    } else if (msg.content == "\\next"){
        console.log(122);

        if (dispatch == null || dispatch =="" || dispatch == undefined) {
            msg.channel.send("No queue! ngu vc");
        } else if (playList.length == 1){
            playList.pop();
            dispatch.pause(false);
            dispatch = [];

        } else {
            dispatch.pause(true);
            console.log(10);
            playList.shift();
            play(connection , msg , 0);
        }
    } else if (msg.content == "\\pause"){

        try {
            dispatch.pause(true);
        } catch (error) {
            msg.channel.send("ngu vc");
        }
    

    } else if (msg.content == "\\resume"){
 
        try {
            dispatch.resume();
        }
        catch(err) {
            msg.channel.send("Hong resume được âu :'( ");
        } 

    } else if (msg.content == "\\playlist"){
        var i = 0;
        if ( playList.length <= 0){
            msg.channel.send("đéo có :(");
        } else
            playList.map(function(value){
                msg.channel.send(i + ". " + value.title);
                i++;
            })
    } else if (msg.content == "\\stop"){
        // console.log("Asdfd");

        try{
            dispatch.pause();
            dispatch = [];
            while(playList.length){
                playList.pop();
            }
        } catch(err) {
            msg.channel.send("ngu!");
        }
        // connection.disconnect();

    } else if (key == "\\remove"){
        try {
            console.log(order);
            var i = -1;
            playList = playList.filter(function(){
                i++;
                return i != parseInt(order); 
            })
        } catch(err){
            msg.channel.send("ngu zậy cậu !");
        }
    } else if (msg.content == "\\help"){
        var command = [
            "\\remove + [pos]", "\\pause/playlist/resume/next/stop" , "\\q + [key word]" , "\\tts + text"
        ]
        command.map(function(value){
            msg.channel.send(value);
        })
    } else if (key == "\\volume"){
        if (dispatch == "" || dispatch == undefined) {
            msg.reply("No audio");
            return;
        }
        if (order == " status"){
            msg.channel.send(dispatch.volume);
            return;
        }
        volume = parseInt(order);
        dispatch.setVolume(volume / 100);
        msg.channel.send("Okay !");
    } else if (msg.content == "\\disconnect"){
        try{
            msg.reply('Bye!!!');
            connection.disconnect();
        }
        catch(err){
            msg.channel.send("Can't disconnect!");
        }
       

    }
    
}
 
module.exports.textToSpeech = async msg => {
    if (msg.author.bot) return; 
    var i = msg.content.indexOf(' ');
    // console.log(msg.author.bot);

    var key = msg.content.slice(0, i);

    // console.log(msg.content);
    try {
        var order = msg.content.substr(i);
    } catch (err) { 
        var order = "a";
    }

    if (key != "\\tts" && msg.content != "\\tts") return;
    setting.input.text = order != "s" ? order : "Nhập cái gì đó đi thằng lồn!"; 
    // console.log(order);
    

    const [res] = await client.synthesizeSpeech(setting);
 
    const writeFile = util.promisify(fs.writeFile);

    await writeFile(setting.outputFileName, res.audioContent, "binary");
 
    // var broadCast = bot.voice.createBroadcast();
    
    if (!connection) connection = await msg.member.voice.channel.join();

    try {
        var timeStream = dispatch.totalStreamTime / 1000 + dispatch.streamOptions.seek;
        // let connection = await msg.member.voice.channel.join();
        // dispatch.pause(true);
        var dis =  await connection.play("output1.mp3");
        dis.setVolume(2);


        dis.on( "finish" , () => {play(connection , msg , timeStream)});
    } catch(err) {
        var dis = await connection.play("output1.mp3");
        dis.setVolume(2);
        
    }  
}