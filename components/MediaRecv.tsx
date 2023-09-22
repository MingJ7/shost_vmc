"use client"
import hostPeer from '@/libs/hostPeer';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Preview } from './MediaStreamPreview';

type client = {
    dataConn: DataConnection,
    mediaConn: MediaConnection | undefined
}

function connMapUpdater(state: Map<string, client>, action: {type: string, dataConn?: DataConnection, mediaConn?: MediaConnection}){
    if (action.dataConn === undefined && action.mediaConn === undefined) return state;

    const newConnMap = new Map(state);
    const connID = action.dataConn?.peer ?? action.mediaConn?.peer ?? ""
    if (action.type === "ADD"){
        if (action.dataConn){
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                newConnMap.get(connID)!.dataConn?.close();
                newConnMap.get(connID)!.dataConn = action.dataConn;
            } else {
                // create a new entry
                newConnMap.set(connID, {dataConn: action.dataConn, mediaConn: undefined});
            }
        } else {
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                console.log(newConnMap.get(connID))
                newConnMap.get(connID)!.mediaConn?.close();
                newConnMap.get(connID)!.mediaConn = action.mediaConn;
                // if (!action.mediaConn?.open) action.mediaConn?.answer()
            } else {
                // reject the call if there is no data stream
                console.log("call rejected")
                action.mediaConn?.close()
            }
        }
    } else if (action.type === "REMOVE"){
        if (action.dataConn){
            newConnMap.get(connID)?.dataConn?.close();
            // newConnMap.get(connID)?.mediaConn?.close();
            newConnMap.delete(connID)
        } else {
            newConnMap.get(connID)?.dataConn.send("Media Connection Closed")
            newConnMap.get(connID)?.mediaConn?.close();
            if (newConnMap.has(connID))
                if (action.mediaConn === newConnMap.get(connID)?.mediaConn)
                    newConnMap.get(connID)!.mediaConn = undefined
        }
    }
    console.log(newConnMap)
    return newConnMap;
}

export default function MediaRecv() {
    const [peer, setPeer] = useState<undefined | Peer>(undefined);
    const [myID, setMyID] = useState("")

    const [connMap, updateConnMap] = useReducer(connMapUpdater, new Map<string, client>())
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    
    const newDataConn = (dataConn: DataConnection) => {
        console.log("react callback connection");
        updateConnMap({type: "ADD", dataConn:dataConn})
        updateLog("Connected to peer: " + dataConn.peer)
        dataConn.on("close", () => {
            updateConnMap({type: "REMOVE", dataConn:dataConn})
        })
    }

    const newMediaConn = (mediaConn: MediaConnection) => {
        console.log("react callback call");
        updateConnMap({type:"ADD", mediaConn:mediaConn})
        updateLog("Stream from peer: " + mediaConn.peer)
        updateLog("Connection ID: " + mediaConn.connectionId)
        let temp = mediaConn.remoteStream
        mediaConn.on("stream", (stream) => {
            if (temp === stream) {console.log("same stream added"); return;}
            updateLog("stream added for " + mediaConn.connectionId)
            console.log("stream has been added")
            temp = stream;
        })
        mediaConn.on("close", () => {
            updateConnMap({type: "REMOVE", mediaConn:mediaConn})
            console.log("stream has ended")
        })
        mediaConn.answer()
    }

    function setup(){
        console.log("setup is run");
        const newPeer = new hostPeer();
        newPeer.on('open', () => setMyID(newPeer.id));
        newPeer.on('connection', newDataConn);
        newPeer.on('call', newMediaConn);
        
        setPeer(newPeer);
        return function cleanup() {
            peer?.destroy()
            setPeer(undefined)
        }
    }

    useEffect(setup, [])
    console.log("render")
    return (<div>
        <p>Share the for others to join</p>
        <a href={window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}>
            {window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}
        </a>
        <div id='Log' className='top-1 overflow-auto flex-1'>
            {
                log.map((ele, idx) => {
                    return <p className='text-center border-spacing-1' key={idx}>{ele}</p>
                })
            }
        </div>
        {
            Array.from(connMap).map(([id, client], idx) => (
                <div key={id}>
                    <p>Peer {idx}: {id}</p>
                    <Preview mediaStream={client.mediaConn?.remoteStream}/>
                </div>
            ))
        }
    </div>)
}

