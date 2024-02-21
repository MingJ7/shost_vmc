"use client"
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { ClientConnection } from './ClientConnection';

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
                newConnMap.get(connID)!.mediaConn?.close();
                newConnMap.get(connID)!.mediaConn = action.mediaConn;
                // if (!action.mediaConn?.open) action.mediaConn?.answer()
            } else {
                // reject the call if there is no data stream
                console.log("call rejected due to mising data Conn")
                action.mediaConn?.close()
            }
        }
    } else if (action.type === "REMOVE"){
        if (action.dataConn){
            newConnMap.get(connID)?.dataConn?.close();
            // newConnMap.get(connID)?.mediaConn?.close();
            newConnMap.delete(connID)
        } else {
            newConnMap.get(connID)?.dataConn.send("Media Connection Closed by remove action")
            newConnMap.get(connID)?.mediaConn?.close();
            if (newConnMap.has(connID))
                if (action.mediaConn === newConnMap.get(connID)?.mediaConn)
                    newConnMap.get(connID)!.mediaConn = undefined
        }
    }
    console.log(newConnMap)
    return newConnMap;
}

export default function MediaRecv({peer}: {peer?: Peer}) {
    const logRef = useRef(null)

    const [connMap, updateConnMap] = useReducer(connMapUpdater, new Map<string, client>())
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    
    const newDataConn = (dataConn: DataConnection) => {
        console.log("dataconn label", dataConn.label)
        if (dataConn.label === "init") return;
        console.log("New Data Connection");
        updateConnMap({type: "ADD", dataConn:dataConn})
        updateLog("Connected to peer: " + dataConn.peer)
        dataConn.on("close", () => {
            updateLog("Disconnected from peer: " + dataConn.peer)
            updateConnMap({type: "REMOVE", dataConn:dataConn})
        })
    }

    const newMediaConn = (mediaConn: MediaConnection) => {
        console.log("New Media Connection");
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
            console.log("Media Connection Closed")
        })
        mediaConn.answer()
    }

    function setup(){
        peer?.on('connection', newDataConn);
        peer?.on('call', newMediaConn);
    }

    useEffect(setup, [peer])
    return (<div>
        <div id='Log' className='top-1 overflow-auto flex-1 h-60' ref={logRef}>
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
                    <ClientConnection cl={client}/>
                </div>
            ))
        }
    </div>)
}

