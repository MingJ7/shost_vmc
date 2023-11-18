"use client"

import { myPeerConfig } from "@/libs/config"
import Peer from "peerjs"
import { useEffect, useState } from "react"

export default function PeerComponent({peer, setPeer}: {peer?: Peer, setPeer: CallableFunction}){
    const [lastPeer, setLastPeer] = useState(peer);

    function setup(){
        console.log("peer setup called")
        var newPeer: undefined | Peer;
        newPeer = new Peer(myPeerConfig);
        function destroyPeer() {
            newPeer?.destroy();
            console.log("destroyed peer", newPeer)
        }
        setPeer(newPeer);
        setLastPeer(newPeer);
        return function cleanup(){
            // timeout so that peerjs server will record correctly
            setTimeout(() => { destroyPeer(); }, 100);
            window.removeEventListener("beforeunload", destroyPeer);
        };
    }

    function peerChange(){
        if (lastPeer === undefined) return;
        console.log("peer cahnge", lastPeer, peer)
        if (lastPeer !== peer) 
            lastPeer.destroy();
        
        function destroyPeer() {
            peer?.destroy();
            console.log("destroyed peer", peer)
        }

        window.addEventListener("beforeunload", destroyPeer);
        return function cleanup(){
            destroyPeer();
            window.removeEventListener("beforeunload", destroyPeer);
        };
    }

    useEffect(setup, [])
    useEffect(peerChange, [peer])
    
    return <div>
        <div>Peer id: {peer?.id}</div>
        <div>Destroyrd: {JSON.stringify(peer?.destroyed)}</div>
        <button onClick={() => setPeer(new Peer(myPeerConfig))}>new ID</button>
    </div>
}