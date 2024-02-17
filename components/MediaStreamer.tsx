"use client"
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { useEffect, useState } from 'react';
import { ClientPreview } from './MediaStreamClientPreview';
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
  
export default function MediaStreamer({peer, remoteID, mediaStream}: {peer?: Peer, remoteID: string, mediaStream?: MediaStream}) {
    const [conn, setConn] = useState<undefined | DataConnection>();
    const [passthrough, setpassthrough] = useState("web");
    
    const [link, setLink] = useState<undefined | WSrecieverLink>();
    const [log, setLog] = useState(new Array<string>());
    
    function updatepassthrough(newState: string){
        const settingData = {passthrough: false};
        if (newState !== "video"){
            settingData.passthrough = true
        }
        conn?.send({type:"setting", data:settingData});
        setpassthrough(newState);
        if (newState === "host"){
            const newLink = new WSrecieverLink(35749)
            setLink(newLink)
            newLink.addListener("message", (msg: Blob) => {
                msg.arrayBuffer().then((abuf) =>{
                    console.log(abuf)
                    conn?.send({type:"motionData", data: abuf})

                })
            })
        }
    }

    function setupPeer(peer: Peer){
        console.log("client:", peer.id)
        const c = peer?.connect(remoteID);
        c.on("open",() => {
            // only assign the connection on connected
            setConn(c);
        })
        c.on('data', (raw) => {
            if (typeof raw === "string")
                setLog([...log, raw]);
            else if (raw instanceof Object){
                const datastr = JSON.stringify(raw);
                const data = raw as any;
                if (data.type === "ping"){
                    c.send({type:"pong"});
                }
            }
        });
    }

    function streamSetup(){
        if (passthrough === "web") return;
        let stream: MediaConnection;
        if(peer && conn && mediaStream){
            stream = peer.call(remoteID, mediaStream);
        }

        return function cleanup(){
            if (stream) stream.close()
        }
    }

    useEffect(() => {
        if (peer !== undefined){
            if (peer.open)
                setupPeer(peer);
            else
                peer.addListener("open", (id) => setupPeer(peer));
        } 
    }, [peer])
    useEffect(streamSetup, [mediaStream])
    
    return (<div>
        <select id='transmitSelect' value={passthrough} onChange={evt => updatepassthrough(evt.target.value)}>
            <option value="video">Send video (peer compute)</option>
            <option value="web">Send tracking (browser compute)</option>
            <option value="host">Send tracking (external compute)</option>
        </select>
        {
            passthrough === "web" && conn ? 
                <ClientPreview mediaStream={mediaStream} dataConnection={conn}/>
            :
                undefined
        }
        <div id='Log' className='top-1 overflow-auto flex-1'>
            {
                log.map((ele) => {
                    return <p className='h-20 text-center bottom-1' key={ele}>{ele}</p>
                })
            }
        </div>
    </div>)
}
