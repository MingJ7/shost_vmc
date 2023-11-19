"use client"
import MediaRecv from '@/components/MediaRecv';
import SlientAudio from '@/components/SlientAudio';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const PeerComponent = dynamic(() => import("../../components/PeerComponent"), {ssr: false})

export default function Component() {
    const [peer, setPeer] = useState<undefined | Peer>();
    const [myID, setMyID] = useState("");
    const [hosturl, setHosturl] = useState("");

    function updatePeer(peer: undefined | Peer){
        if (peer === undefined) return;
        if (peer.open)
            setMyID(peer.id)
        else
            peer.addListener("open", (id) => setMyID(id));
        setPeer(peer);
    }
    
    useEffect(()=>{
        setHosturl(window.location.protocol + "//" + window.location.host);
    }, [])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <p>Share the for others to join</p>
        <a href={hosturl + "/jointVMC/join/" + myID}>
            {hosturl + "/jointVMC/join/" + myID}
        </a>
        <MediaRecv peer={peer}/>
        <SlientAudio/>
    </div>)
}
