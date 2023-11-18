"use client"
import MediaRecv from '@/components/MediaRecv';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useState } from 'react';

const PeerComponent = dynamic(() => import("../../components/PeerComponent"), {ssr: false})

export function Component() {
    const [peer, setPeer] = useState<undefined | Peer>();
    const [myID, setMyID] = useState("");

    function updatePeer(peer: undefined | Peer){
        if (peer === undefined) return;
        if (peer.open)
            setMyID(peer.id)
        else
            peer.addListener("open", (id) => setMyID(id));
        setPeer(peer);
    }
    
    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <p>Share the for others to join</p>
        <a href={window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}>
            {window.location.protocol + "//" + window.location.host + "/jointVMC/join/" + myID}
        </a>
        <MediaRecv peer={peer}/>
    </div>)
}

export default dynamic (() => Promise.resolve(Component), {ssr:false});