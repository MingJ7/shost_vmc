"use client"
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { useEffect, useState } from 'react';
import { ClientPreview } from './MediaStreamClientPreview';

export default function MediaStreamer({peer, remoteID, mediaStream}: {peer?: Peer, remoteID: string, mediaStream?: MediaStream}) {
    const [conn, setConn] = useState<undefined | DataConnection>();
    const [passthrough, setpassthrough] = useState("true");
    
    const [log, setLog] = useState(new Array<string>())
    
    function updatepassthrough(newState: string){
        const settingData = {passthrough: false};
        if (newState === "true"){
            settingData.passthrough = true
        }
        conn?.send({type:"setting", data:settingData});
        setpassthrough(newState);
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
        if (passthrough === "true") return;
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
            <option value="false">Send video (Host compute)</option>
            <option value="true">Send tracking (Self compute)</option>
        </select>
        {
            passthrough === "true" && conn ? 
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
