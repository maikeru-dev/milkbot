import { Message, VoiceState, Client, Intents} from "discord.js";
require('dotenv').config()

const token = process.env.token;

class ExtendedClient extends Client {
  prefix = ">"
}
const client = new ExtendedClient({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_VOICE_STATES] });

class userEntry{
  // I'm creating a object constructor : https://www.typescriptlang.org/docs/handbook/2/classes.html
  ID:string;
  totalLength:number;
  sessionAge:number;
  sessionStarted:boolean;
  constructor(ID = "",totalLength = 0, sessionAge = 0, sessionStarted = false){
    this.ID = ID
    this.totalLength = totalLength
    this.sessionAge = sessionAge
    this.sessionStarted = sessionStarted
  };
}

type myUserDB = {
  ID:string;
  totalLength:number;
  sessionAge:number;
  sessionStarted:boolean;
}
var userDB:myUserDB[] = []

function findUser(id:string){
  let found:boolean = false
  let counter:number = 0
  while(found == false && (counter) < userDB.length){
    if (userDB[counter].ID == id){
      found = true
    }else{
      counter++
    }
  }
  if(found){
    return {user:userDB[counter], index:counter}
  }else{
    return {user:null, index:null}
  }
}


client.on('ready', () => {
  console.log(`Logged in as ${client?.user?.tag}!`);
});
client.on('voiceStateUpdate', (oldState : VoiceState, newState : VoiceState) => {

  // determine if it was a disconnect by channel id omittment
  //channel id will be null if the user leaves in change state
  // there are 4 state updates that can occur
  //disconnect(oldstate channelid occurs, newstate channelid is omitted)
  //connect(oldstate channelid is omitted, newstate channelid occurs)
  //switch(oldstate channelid occurs, newstate channelid occurs)
  //userUpdate(oldstate channelid occurs, newstate channelid occurs)

  if(!oldState.channelId){// connect
    if(newState.channelId){
      console.log("User has connected!")
      let userinfo = findUser(newState.id)
      if(userinfo.user){
        let userEntry = userDB[userinfo.index]
        userEntry.sessionStarted = true
        userEntry.sessionAge = Date.now()
      }else{
        userDB.push(new userEntry(newState.id,0,Date.now(),true))
      }
    }
  }else{ // disconnect
    if(!newState.channelId){
      console.log("User has disconnected!")
      let userinfo = findUser(newState.id)
      if(userinfo.user){
        let userEntry = userDB[userinfo.index]
        userEntry.sessionStarted = false
        userEntry.totalLength += (Date.now() - userEntry.sessionAge)
        userEntry.sessionAge = 0
      }else{
        userDB.push(new userEntry(newState.id,0,Date.now(),false))
      }
    }
  }
});

client.on('messageCreate', (msg: Message) => {
    if(msg.author.bot) return
    if(msg.content.charAt(0) == client.prefix){
      let command = msg.content.slice(1).split(/ +/) // this creates an array of arguments
      switch(command[0]){
        case "calllength":
          command = command.slice(1)
          let id : string
          let user:myUserDB | null
          if(command.length < 1) {
            id = msg.author.id
          }else {
            id = command[1]
          }
          user = findUser(id).user
          if(user){
            msg.channel.send("Total call time is: " + formatTime(user.totalLength+((user.sessionStarted) ? (Date.now() - user.sessionAge) : 0)));
          }else{
            msg.channel.send("Your entry was not found, this means you haven't joined a voice channel before.")
          }
      }
    }else{
      return
    }
})
function formatTime(time:number){
  let seconds = Math.floor(time / 1000)
  let minutes = seconds / 60
  let hours = minutes / 60
  let days = hours / 24
  let weeks = days / 7
  let message = ""
  if (weeks >= 1){
    message += `${weeks} weeks, `
  }
  if(days >= 1){
    message += `${days} days, `
  }
  if(hours >= 1){
    message += `${hours} hours, `
  }
  if(minutes >= 1){
    message += `${minutes} minutes, `
  }
  message += `${seconds} seconds.`
  return message;
}
client.login(token);