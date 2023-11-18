"use client"
import MediaRecv from '@/components/MediaRecv';
import MediaStreamer from '@/components/MediaStreamer';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const PeerComponent = dynamic(() => import("../../../components/PeerComponent"), {ssr: false})

export function Component() {
    const [peer, setPeer] = useState<undefined | Peer>();
    const param = useParams();
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
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
            if (!remoteList.find((val) => val == dc.peer)){
                setRemoteList([...remoteList, dc.peer]);
            }
            dc.send({type:"init", remoteList:remoteList})
        })
        peer?.addListener("open", () =>{
            const c = peer?.connect(remote, {label: "init"});
            c.on('data', (msg: unknown) => {
                var data: any
                if (typeof msg === "string")
                    data = JSON.parse(msg as string);
                else
                    data = msg
                if (data.remoteList){
                    setRemoteList(data.remoteList)
                }
            });
        })
        setRemoteList([remote]);
    }, [peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <MediaSelection setMediaStream={setMediaStream}/>
        <p>List: {remoteList.toString()}</p>
        {remoteList.map(remote => <MediaStreamer key={remote} peer={peer} remoteID={remote} mediaStream={mediaStream} />)}
        <MediaRecv peer={peer}/>
    </div>)
}

export default dynamic (() => Promise.resolve(Component), {ssr:false});