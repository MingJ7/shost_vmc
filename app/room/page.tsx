"use client"
import MediaRecv from '@/components/MediaRecv';
import MediaStreamer from '@/components/MediaStreamer';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const PeerComponent = dynamic(() => import("../../components/PeerComponent"), {ssr: false})

export function Component() {
    const [peer, setPeer] = useState<undefined | Peer>();
    const [myID, setMyID] = useState("");
    const [remoteList, setRemoteList] = useState(new Array<string>())
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

    function updatePeer(peer: undefined | Peer){
        if (peer === undefined) return;
        if (peer.open)
            setMyID(peer.id)
        else
            peer.addListener("open", (id) => setMyID(id));
        setPeer(peer);
    }

    useEffect(()=>{
        peer?.addListener('connection', (dc) => {
            if (!remoteList.find((val) => val == dc.peer))
                setRemoteList([...remoteList, dc.peer]);
            dc.send({type:"init", remoteList:remoteList})
        });
        peer?.addListener("open", (id) => setMyID(id));
    }, [peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
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

export default dynamic (() => Promise.resolve(Component), {ssr:false});