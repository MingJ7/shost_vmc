"use client"
import { myPeerConfig } from '@/libs/config';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const MediaRecv = dynamic(() => import("../../components/MediaRecv"), {ssr: false})

export default function Component() {
    const [peer, setPeer] = useState(() => new Peer(myPeerConfig));

    useEffect(()=>{
        window.addEventListener('beforeunload', peer.destroy);
    }, [])
    return (<div>
        <MediaRecv peer={peer}/>
    </div>)
}
