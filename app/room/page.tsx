"use client"
import MediaRecv from '@/components/MediaRecv';
import { MediaSelection } from '@/components/selectors/input';
import { myPeerConfig } from '@/libs/config';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const MediaStreamer = dynamic(() => import("../../components/MediaStreamer"), { ssr: false })

export default function Component() {
    const [peer, setPeer] = useState(() => new Peer(myPeerConfig));
    const [myID, setMyID] = useState("");
    const [remoteList, setRemoteList] = useState(new Array<string>())
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

    useEffect(()=>{
        peer.addListener('connection', (dc) => {
            setRemoteList([...remoteList, dc.peer]);
            dc.send({type:"init", remoteList:remoteList})
        });
        peer.addListener("open", (id) => setMyID(id));
        // setMyID(peer.id);
        window.addEventListener('beforeunload', (evt) => peer.destroy());
    }, [])

    return (<div>
        <p>Share the for others to join</p>
        <a href={window.location.protocol + "//" + window.location.host + "/jointVMC/room/" + myID}>
            {window.location.protocol + "//" + window.location.host + "/jointVMC/room/" + myID}
        </a>
        <p>List: {remoteList.toString()}</p>
        <MediaSelection setMediaStream={setMediaStream}/>
        {remoteList.map(remote => <MediaStreamer key={remote} peer={peer} remoteID={remote} mediaStream={mediaStream} />)}
        <MediaRecv peer={peer}/>
    </div>)
}
