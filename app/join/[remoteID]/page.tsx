"use client"
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const MediaStreamer = dynamic(() => import("../../../components/MediaStreamer"), { ssr: false })

export default function Component() {
    const param = useParams();
    const [myID, setMyID] = useState("");
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()


    return (<div>
        <MediaSelection setMediaStream={setMediaStream}/>
        <MediaStreamer remoteID={remote} mediaStream={mediaStream} />
    </div>)
}
