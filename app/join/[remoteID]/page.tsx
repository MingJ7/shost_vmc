"use client"
import { MediaSelection } from '@/components/selectors/input';
import { myPeerConfig } from '@/libs/config';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const MediaStreamer = dynamic(() => import("../../../components/MediaStreamer"), { ssr: false })

export default function Component() {
    const param = useParams();
    const [myID, setMyID] = useState("");
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [peer, setPeer] = useState(() => new Peer(myPeerConfig));
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

    useEffect(()=>{
        window.addEventListener('beforeunload', (evt) => peer.destroy());

    }, [])
    return (<div>
        <MediaSelection setMediaStream={setMediaStream}/>
        <MediaStreamer peer={peer} remoteID={remote} mediaStream={mediaStream} />
    </div>)
}
