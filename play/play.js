const discord = require('discord.js');
const ytdl = require("ytdl-core-discord");
const yts = require('yt-search');

var playList = [];
var dispatch;
var connection;
var volume = 50;

async function play(connection , msg) {
    
        var url = playList[0].url;

        dispatch = connection.play(await ytdl(url), {
            type: 'opus',
            filter : format => format.quanlity =="360p"
        });
        // console.log(dispatch)
        // console.log(playList);
        dispatch.setBitrate(128);

        dispatch.setVolume(volume /100);
        dispatch.setFEC(true);

        dispatch.on('finish' , () => {
            if (playList.length <= 1)
            {
                playList.shift();
                connection.disconnect();
            }
            else {
                playList.shift();
                // msg.channel.send(playList[0].title);
                play(connection , msg);
                
            }
        })

        dispatch.on("error", () =>{
            console.log("error");
        })

        dispatch.on("volumeChange" ,() => {
           
            console.log("change volume");
        })
};

module.exports.play = async msg => {
    
    if (msg.author.bot || ! msg.content.startsWith("!")) return;


    var i = msg.content.indexOf(' ');

    var key = msg.content.slice(0, i);

    // console.log(msg.content);
    try{
    var order = msg.content.substr(i);
    }catch(err){
    var order = "a";
    }

    var urlCheck = order.indexOf("http");
    // console.log(msg.embeds[0].video);
    if (key == "!q"){
        connection = await msg.member.voice.channel.join();
        console.log(msg.guild.id);
        var keyWord = urlCheck == -1 ? order : msg.embeds[0].title;
        var a = await yts(keyWord);
        var data = a.videos[0];
        // console.log(data);
        if (playList[0]){
            playList.push(data);
            msg.channel.send(data.title);
  
        }else{
            playList.push(data);
            play(connection , msg);
            msg.channel.send("play!");
        }
    } else if (msg.content == "!next"){
        console.log(122);

        if (!dispatch) {
            msg.channel.send("No queue! ngu vc");
        } else if (playList.length == 1){
            console.log("12");

            connection.disconnect();
        } else {
            dispatch.pause(true);
            console.log(10);
            playList.shift();
            play(connection , msg);
        }
    } else if (msg.content == "!pause"){

        if (dispatch)
            dispatch.pause(true);
        else msg.channel.send("ngu vc");

    } else if (msg.content == "!resume"){

        if (dispatch) 
            dispatch.resume();
        else msg.dispatch.send("ngu");

    } else if (msg.content == "!playlist"){
        var i = 0;
        if (!playList){
            msg.channel.send("đéo có :(");
        } else
            playList.map(function(value){
                msg.channel.send(i + ". " + value.title);
                i++;
            })
    } else if (msg.content == "!stop"){
        if (dispatch){
            connection.disconnect();
            playList = [];
        } else {
            msg.channel.send("ngu!");
        }
    } else if (key == "!remove"){
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
    } else if (msg.content == "!help"){
        var command = [
            "!remove + [pos]", "!pause/playlist/resume/next/stop" , "!q + [key word]" 
        ]
        command.map(function(value){
            msg.channel.send(value);
        })
    } else if (key == "!volume"){
        if (!dispatch) {
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
    }
  
} 


module.exports.joinAgain =async msg =>{
    connection = await msg.member.voice.channel.join();
}