"use client"
import { DataConnection } from 'peerjs';
import { useState } from 'react';
import { EventEmitter } from "events";

export class WSrecieverLink extends EventEmitter {
    port: number;
    ws: WebSocket;
  
    constructor(port: number){
      super()
      this.port = port;
      this.ws =  WSrecieverLink.createWebSocket(port);
      this.ws.addEventListener("message", (evt) =>{
        this.emit("message", evt.data)
      })
    }
  
    setPort(port: number){
      this.port = port;
      this.ws.close();
      this.ws = WSrecieverLink.createWebSocket(port);
      this.ws.addEventListener("message", (evt) =>{
        this.emit("message", evt.data)
      })
    }
  
    close(){
      this.ws.close();
    }
  
    static createWebSocket(port: number){
      const ws = new WebSocket("ws://localhost:8765");
      ws.addEventListener("open", () => ws.send(JSON.stringify({type: "recv", port: port})));
      return ws;
    }
  }
  
export default function TransmissionSelector({transmissionType, setTransmissionType, dataConnection}: {transmissionType: string, setTransmissionType: (type: string) => void, dataConnection: DataConnection | undefined}) {
    const [link, setLink] = useState<undefined | WSrecieverLink>();
    
    function updateTransmissionType(newState: string){
        const settingData = {passthrough: false};
        if (newState !== "video"){
            settingData.passthrough = true
        }
        dataConnection?.send({type:"setting", data:settingData});
        setTransmissionType(newState);
        if (newState === "host"){
            const newLink = new WSrecieverLink(35749)
            setLink(newLink)
            newLink.addListener("message", (msg: Blob) => {
                msg.arrayBuffer().then((abuf) =>{
                    console.log(abuf)
                    dataConnection?.send({type:"motionData", data: abuf})

                })
            })
        }
    }

    return (<div>
        <select id='transmitSelect' value={transmissionType} onChange={evt => updateTransmissionType(evt.target.value)}>
            <option value="video">Send video (peer compute)</option>
            <option value="web">Send tracking (browser compute)</option>
            <option value="host">Send tracking (external compute)</option>
        </select>
    </div>)
}
