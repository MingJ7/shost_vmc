"use client"
import MediaStreamer from '@/components/MediaStreamer';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer from 'peerjs';
import { useState } from 'react';

const PeerComponent = dynamic(() => import("../../../components/PeerComponent"), {ssr: false})

export default function Component() {
    const param = useParams();
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [peer, setPeer] = useState<undefined | Peer>();
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

    return (<div>
        <PeerComponent peer={peer} setPeer={setPeer}/>
        <MediaSelection setMediaStream={setMediaStream}/>
        <MediaStreamer peer={peer} remoteID={remote} mediaStream={mediaStream} />
    </div>)
}
