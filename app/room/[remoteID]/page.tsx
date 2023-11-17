"use client"
import MediaRecv from '@/components/MediaRecv';
import { MediaSelection } from '@/components/selectors/input';
import { myPeerConfig } from '@/libs/config';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer from 'peerjs';
import { useEffect, useState } from 'react';

const MediaStreamer = dynamic(() => import("../../../components/MediaStreamer"), { ssr: false })

export default function Component() {
    const param = useParams();
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [peer, setPeer] = useState(() => new Peer(myPeerConfig));
    const [myID, setMyID] = useState(peer.id);
    const [remoteList, setRemoteList] = useState(new Array<string>())
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()
    console.log(remoteList);
    useEffect(()=>{
        peer.addListener('connection', (dc) => {
            setRemoteList([...remoteList, dc.peer]);
            dc.send({type:"init", remoteList:remoteList})
        })
        peer.addListener("open", () =>{
            const c = peer.connect(remote, {label: "init"});
            c.on("open",() => {
                // only assign the connection on connected
            })
            c.on('data', (msg: unknown) => {
                var data: any
                if (typeof msg === "string")
                    data = JSON.parse(msg as string);
                else
                    data = msg
                if (data.remoteList){
                    console.log("setting remote list")
                    setRemoteList(data.remoteList)
                }
            });
        })
        setRemoteList([remote]);
        window.addEventListener('beforeunload', (evt) => peer.destroy());
    }, [])

    return (<div>
        <MediaSelection setMediaStream={setMediaStream}/>
        <p>List: {remoteList.toString()}</p>
        {remoteList.map(remote => <MediaStreamer key={remote} peer={peer} remoteID={remote} mediaStream={mediaStream} />)}
        <MediaRecv peer={peer}/>
    </div>)
}
