const ytdl = require("ytdl-core");
const yts = require('yt-search');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require("fs");
require("dotenv").config();
var util = require("util");
const discord = require("discord.js");
const { DH_NOT_SUITABLE_GENERATOR } = require("constants");
const { repeat, indexOf } = require("ffmpeg-static");

const keyFile = 'textToSpeech/authClientAPIGoogle.json';
const projectId = process.env.PROJECTID;


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
var countDown;
var indexPlay = 0;


async function play(connection , msg , begin, index) {
    if (countDown != undefined) clearTimeout(countDown);
    indexPlay = index;
        countDown = setTimeout(function () {
            connection.disconnect();
            connection = undefined;
            dispatch = undefined;
            countDown = undefined;
            volume = 50;
            playList.splice(0);
        }, 1000 * 60 * 60);

        var url;
        try {
            url = playList[index].url;
            // console.log(url);    
        } catch (error) {
            msg.reply("Opp!!");
            return;
        }    
        // console.log(playList);

        dispatch = connection.play(await ytdl(url, { format: "audioonly" }), {
            seek: begin,
            fec: true,
            bitrate : "auto",
        });
       
        dispatch.setVolume(volume /100);
        

        dispatch.on('finish' , () => {  
            if (playList.length <= 1)
            {
                if (playList[index].repeat == false) playList.splice(index,1);
                else {
                    clearTimeout(countDown);
                    play(connection, msg, 0, 0);
                }
            }
            else {
                if (playList[index].repeat == false) playList.splice(index , 1);
                clearTimeout(countDown);
                play(connection , msg , 0 , index = index >= playList.length - 1 ? 0 : index + 1);
            }
        })

        dispatch.on("error", async (err) =>{
            console.log(err);
            var timeStream = dispatch.totalStreamTime / 1000 + dispatch.streamOptions.seek;
            connection = undefined;
            connection = await msg.member.voice.channel.join();
            countDown = undefined;
            dispatch = [];
            play(connection, msg, timeStream, index);
        })

        dispatch.on("volumeChange" ,() => {
           
            console.log("change volume");
        })
};


module.exports.play = async msg => {
    
    if (msg.author.bot || !msg.guild || !msg.content.startsWith("\\")) return;


    var i = msg.content.indexOf(' ');

    var key = msg.content.slice(0, i);
    // if (msg.content == "!tts") console.log("Ádasd");
    // console.log(msg.content);
    try{
    var order = msg.content.substr(i);
    }catch(err){
    var order = "";
    }

    var urlCheck = order.indexOf("http");
   
    if (key == "\\q"){
 
        if ( connection == undefined ? msg.member.voice.channel : connection.channel.id != msg.member.voice.channel.id ) connection = await msg.member.voice.channel.join();
       
        var keyWord = urlCheck == -1 ? order : msg.embeds[0].title;
        var a = await yts(keyWord);
        var data = a.videos[0]; 
        // console.log(data);
        if (playList[0]){
            data.repeat = false;
            playList.push(data);
            msg.channel.send(data.title);
  
        }else{
            data.repeat = false;
            playList.push(data);
            play(connection , msg , 0 , 0);
            msg.channel.send("play!");
        }


    } else if (msg.content == "\\next"){
        console.log(122);

        if (dispatch == null || dispatch =="" || dispatch == undefined) {
            msg.channel.send("No queue! ngu vc");
        } else if (playList.length == 1){
            playList.splice(indexPlay , 1);
            dispatch.pause(false);
            dispatch = [];

        } else {
            dispatch.pause(true);
            // console.log(10);
            playList.splice(indexPlay , 1);
            clearTimeout(countDown);            
            play(connection , msg , 0 , indexPlay >= playList.length ? 0 : indexPlay);
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
            "\\remove + [pos]", "\\pause/playlist/resume/next/stop" , "\\q + [key word]" , "\\tts + text",
            "\\repeat/+[pos]/[start/end]", "\\unrepeat/+[pos]/[start/end]","\\disconnect"
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
            countDown = undefined;
            
            connection = undefined;
            dispatch = undefined;
            volume = 50;
            while (playList.length) {
                playList.pop();
            }
        }
        catch(err){
            msg.channel.send("Can't disconnect!");
        }
       

    } else if (msg.content == '\\repeat' || key == '\\repeat'){
        if (msg.content.indexOf(' ') == -1){
            var i;
            for (i = 0; i < playList.length ; i++){
                playList[i].repeat = true;
            }
        }else {
            try {
                var i = 0;
                order = order.trim();
                order = order.split(' ');
                console.log(order);
                order.map((value) => {
                    console.log(value);
                    var tempValue = parseInt(value);
                    console.log(tempValue);
                    console.log(isNaN(tempValue));
                    if (typeof(tempValue) == 'number'){
                        try{
                            playList[tempValue].repeat = true;
                            return;
                        }
                        catch(err){
                            return;
                        }
                    }else {
                        try{
                            console.log(value);
                            var start = value.slice(0, value.indexOf('-'));
                            var end = parseInt(value.slice(-value.indexOf('-')));
                            console.log(start ," " , end);
                            while (start <= end && start < playList.length){
                                playList[start].repeat = true;
                                start++;
                            }
                            return;
                        }
                        catch (err){
                            msg.channel.send("Lỗi rồi :(");
                            return;
                        }
                    }
                })
                playList.map((x ) => {
                    console.log(x.title ," " , x.repeat);
                    return;
                })
            } catch (error) {
                msg.channel.send("Lỗi rồi thằng ngu :(");
                return;
            }
        }
    } else if (msg.content == '\\unrepeat' || key == '\\unrepeat') {
        if (msg.content.indexOf(' ') == -1) {
            var i;
            for (i = 0; i < playList.length; i++) {
                playList[i].repeat = false;
            }
        } else {
            try {
                var i = 0;
                order = order.trim();
                order = order.split(' ');
                console.log(order);
                order.map((value) => {
                    console.log(value);
                    var tempValue = parseInt(value);
                    console.log(tempValue);
                    console.log(isNaN(tempValue));
                    if (typeof(tempValue) == 'number') {
                        try {
                            playList[tempValue].repeat = false;
                            return;
                        } catch (err) {
                            return;
                        }
                    } else {
                        try {
                            console.log(value);
                            var start = value.slice(0, value.indexOf('-'));
                            var end = parseInt(value.slice(-value.indexOf('-')));
                            console.log(start, " ", end);
                            while (start <= end && start < playList.length) {
                                playList[start].repeat = false;
                                start++;
                            }
                            return;
                        } catch (err) {
                            msg.channel.send("Lỗi rồi :(");
                            return;
                        }
                    }
                })
                playList.map((x) => {
                    console.log(x.title, " ", x.repeat);
                    return;
                })
            } catch (error) {
                msg.channel.send("Lỗi rồi thằng ngu :(");
                return;
            }
        }
    }
    
}
 
module.exports.textToSpeech = async msg => {
    if (msg.author.bot || !msg.guild || !msg.content.startsWith('\\')) return; 
    var i = msg.content.indexOf(' ');
    // console.log(msg.author.bot);

    var key = msg.content.slice(0, i);

    // console.log(msg.content);
    try {
        var order = msg.content.substr(i);
    } catch (err) { 
        var order = "";
    }

    if (key != "\\tts" && msg.content != "\\tts") return;
    setting.input.text = order != "s" ? order : "Nhập cái gì đó đi thằng lồn!"; 
    // console.log(order);
    

    const [res] = await client.synthesizeSpeech(setting);
 
    const writeFile = util.promisify(fs.writeFile);

    await writeFile(setting.outputFileName, res.audioContent, "binary");
 
    // var broadCast = bot.voice.createBroadcast();
    
    if ( connection == undefined ? msg.member.voice.channel : connection.channel.id != msg.member.voice.channel.id ) connection = await msg.member.voice.channel.join();

    try {
        var timeStream = dispatch.totalStreamTime / 1000 + dispatch.streamOptions.seek;
        // let connection = await msg.member.voice.channel.join();
        // dispatch.pause(true);
        var dis =  await connection.play("output1.mp3");
        dis.setVolume(2);


        dis.on( "finish" , () => {play(connection , msg , timeStream , indexPlay)});
    } catch(err) {
        var dis = await connection.play("output1.mp3");
        dis.setVolume(2);

        clearTimeout(countDown);
        
        countDown = setTimeout(function (con) {
            con.disconnect();
            connection = undefined;
            dispatch = undefined;
            countDown = undefined;
            volume = 50;
            playList.splice(0);
        }, 1000 * 60 * 60);
        
    }  
}