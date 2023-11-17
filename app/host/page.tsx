"use client"
import { myPeerConfig } from '@/libs/config';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const MediaRecv = dynamic(() => import("../../components/MediaRecv"), {ssr: false})

export default function Component() {
    const [peer, setPeer] = useState(() => new Peer(myPeerConfig));
    const [myID, setMyID] = useState("");

    useEffect(()=>{
        peer.addListener("open", (id) => setMyID(id));
        window.addEventListener('beforeunload', peer.destroy);
    }, [])
    return (<div>
        <p>Share the for others to join</p>
        <a href={window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}>
            {window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}
        </a>
        <MediaRecv peer={peer}/>
    </div>)
}
