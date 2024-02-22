"use client"
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { ClientConnection } from './ClientConnection';
import { client, connMapUpdater } from './helper';

export default function MediaRecv({peer}: {peer?: Peer}) {
    const [connectionMap, updateConnectionMap] = useReducer(connMapUpdater, new Map<string, client>())
    const logRef = useRef(null)

    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    
    const newDataConn = (dataConn: DataConnection) => {
        console.log("dataconn label", dataConn.label)
        if (dataConn.label === "init") return;
        console.log("New Data Connection");
        updateConnectionMap({type: "ADD", dataConn:dataConn})
        updateLog("Connected to peer: " + dataConn.peer)
        dataConn.on("close", () => {
            updateLog("Disconnected from peer: " + dataConn.peer)
            updateConnectionMap({type: "REMOVE", dataConn:dataConn})
        })
    }

    const newMediaConn = (mediaConn: MediaConnection) => {
        console.log("New Media Connection");
        updateConnectionMap({type:"ADD", mediaConn:mediaConn})
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
            updateConnectionMap({type: "REMOVE", mediaConn:mediaConn})
            updateLog("stream closed for " + mediaConn.connectionId)
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
            Array.from(connectionMap).map(([id, client], idx) => (
                <div key={id}>
                    <p>Peer {idx}: {id}</p>
                    <ClientConnection cl={client}/>
                </div>
            ))
        }
    </div>)
}

