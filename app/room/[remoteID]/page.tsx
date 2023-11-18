"use client"
import MediaRecv from '@/components/MediaRecv';
import MediaStreamer from '@/components/MediaStreamer';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer, { DataConnection } from 'peerjs';
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
        peer?.addListener("open", async () =>{
            const c = peer?.connect(remote, {label: "init"});
            const readData = (msg: unknown) => {
                console.log("got init msg", msg)
                var data: any
                if (typeof msg === "string")
                    data = JSON.parse(msg as string);
                else
                    data = msg
                if (data.remoteList){
                    data.remoteList = data.remoteList.filter((val:any) => val != peer.id);
                    setRemoteList((prevState) => [...prevState, ...data.remoteList])
                }
            }
            c.on('data', readData);
            c.addListener("close", () => console.log("init closed"));
        })
        setRemoteList([remote]);
    }, [peer])
    useEffect(()=>{
        peer?.addListener("connection", newPeerConnection);
        return function cleanup(){
            peer?.removeListener("connection", newPeerConnection);
        }
    }, [remoteList, peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <MediaSelection setMediaStream={setMediaStream}/>
        <p>List: {remoteList.toString()}</p>
        {remoteList.map(remote => <MediaStreamer key={remote} peer={peer} remoteID={remote} mediaStream={mediaStream} />)}
        <MediaRecv peer={peer}/>
    </div>)
}

export default dynamic (() => Promise.resolve(Component), {ssr:false});