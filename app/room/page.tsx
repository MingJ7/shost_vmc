"use client"
import MediaRecv from '@/components/MediaRecv';
import MediaStreamer from '@/components/MediaStreamer';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import Peer, { DataConnection } from 'peerjs';
import { useEffect, useState } from 'react';

const PeerComponent = dynamic(() => import("../../components/PeerComponent"), {ssr: false})

export default function Component() {
    const [peer, setPeer] = useState<undefined | Peer>();
    const [myID, setMyID] = useState("");
    const [hosturl, setHosturl] = useState("");
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

    function newPeerConnection(dc: DataConnection){
        if (dc.peer == peer?.id) return
        if (!remoteList.find((val) => val == dc.peer)){
            setRemoteList((prevState) => [...prevState, dc.peer]);
        }
        if (dc.label === "init") {
            dc.addListener("open", () =>
                dc.send({type:"init", remoteList:remoteList})
            )
        }
    }
    
    useEffect(()=>{
        setHosturl(window.location.protocol + "//" + window.location.host);
    }, [])
    useEffect(()=>{
        peer?.addListener("open", (id) => setMyID(id));
    }, [peer])
    useEffect(()=>{
        peer?.addListener("connection", newPeerConnection);
        return function cleanup(){
            peer?.removeListener("connection", newPeerConnection);
        }
    }, [remoteList, peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <p>Share the for others to join</p>
        <a href={hosturl + "/jointVMC/room/" + myID}>
            {hosturl + "/jointVMC/room/" + myID}
        </a>
        <p>List: {remoteList.toString()}</p>
        <MediaSelection setMediaStream={setMediaStream}/>
        {remoteList.map(remote => <MediaStreamer key={remote} peer={peer} remoteID={remote} mediaStream={mediaStream} />)}
        <MediaRecv peer={peer}/>
    </div>)
}
