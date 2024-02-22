"use client"
import Peer, { DataConnection } from 'peerjs';
import { useEffect, useState } from 'react';
import { setupPeer, streamSetup } from './setup';
import { VMCStreamer } from '../poseSolvers/MediapipeSlover';
import EventEmitter from 'events';

export class WSrecieverLink extends EventEmitter {
    port: number;
    ws: WebSocket;

    constructor(port: number) {
        super()
        this.port = port;
        this.ws = WSrecieverLink.createWebSocket(port);
        this.ws.addEventListener("message", (evt) => {
            this.emit("message", evt.data)
        })
    }

    setPort(port: number) {
        this.port = port;
        this.ws.close();
        this.ws = WSrecieverLink.createWebSocket(port);
        this.ws.addEventListener("message", (evt) => {
            this.emit("message", evt.data)
        })
    }

    close() {
        this.ws.close();
    }

    static createWebSocket(port: number) {
        const ws = new WebSocket("ws://localhost:8765");
        ws.addEventListener("open", () => ws.send(JSON.stringify({ type: "recv", port: port })));
        return ws;
    }
}

// Should be a class instead?
export default function Transmitter({transmissionType, peer, mediaStream, remote, vmcStream}: {transmissionType: string, peer: undefined | Peer, mediaStream: undefined | MediaStream, remote: string, vmcStream: undefined | VMCStreamer}) {
    const [dataConnection, setDataConnection] = useState<undefined | DataConnection>();
    const [link, setLink] = useState<undefined | WSrecieverLink>();

    function updateTransmissionType(newState: string) {
        const settingData = { passthrough: false };
        if (newState !== "video") {
            settingData.passthrough = true
        }
        dataConnection?.send({ type: "setting", data: settingData });
        if (newState === "host") {
            const newLink = new WSrecieverLink(35749)
            setLink(newLink)
            newLink.addListener("message", (msg: Blob) => {
                msg.arrayBuffer().then((abuf) => {
                    console.log(abuf)
                    dataConnection?.send({ type: "motionData", data: abuf })

                })
            })
        }

        return function cleanup(){
            if (link){
                link.close();
                setLink(undefined);
            }
        }
    }

    useEffect(() => streamSetup(transmissionType, peer, dataConnection, mediaStream, remote)
    , [transmissionType, peer, mediaStream, dataConnection, remote]);

// ^mod for each remote
    useEffect(function addListenerForSolver(){
        vmcStream?.addListener("data", (data: Buffer) => {
            if (dataConnection?.open){
                dataConnection.send({type:"motionData", data: data})
            }
        })
    }, [vmcStream])

    useEffect(() => {
        updateTransmissionType(transmissionType);
    }, [transmissionType])

    useEffect(() => {
        if (peer !== undefined){
            if (peer.open)
                setupPeer(peer, remote, setDataConnection);
            else
                peer.addListener("open", (id) => setupPeer(peer, remote, setDataConnection));
        } 
    }, [peer, remote])
    return (<div>
    </div>)
}
