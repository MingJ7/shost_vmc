import { VMCStreamer } from "./MediapipeSlover";

var intervalTime = 1000/30
var time = -1
var play = false


self.addEventListener("message", (msg) =>{
  console.log("worker got msg", msg.data)
  if (msg.data.type === "control"){
    play = msg.data.play
  } else if (msg.data.type === "time"){
    time = msg.data.time
  } else if (msg.data.type === "interval"){
    intervalTime = msg.data.interval
  }
})

const ticker = setInterval(() => {
  if (play)
    self.postMessage(time);
}, intervalTime);