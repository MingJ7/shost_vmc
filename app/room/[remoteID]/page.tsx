"use client"
import MediaRecv from '@/components/receiver/MediaRecv';
import TransmissionSelector from '@/components/transmitters/TransmissionSelector';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import Peer, { DataConnection } from 'peerjs';
import { useEffect, useReducer, useRef, useState } from 'react';
import { VMCStreamer } from '@/components/poseSolvers/MediapipeSlover';
import VideoPreview from '@/components/previews/VideoPreview';
import { MediaStreamEnder } from '@/components/selectors/MediaStreamEnder';
import { MediaStreamStarter } from '@/components/selectors/MediaStreamStarter';
import Transmitter from '@/components/transmitters/Transmitter';
import { useParams } from 'next/navigation';
import { client, connMapUpdater } from '@/components/receiver/helper';

const PeerComponent = dynamic(() => import("../../../components/PeerComponent"), {ssr: false})
const VMCComponent =  dynamic(() => import("../../../components/poseSolvers/VMCComponent"), {ssr: false})


export default function Component() {
    const param = useParams();
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [myID, setMyID] = useState("");
    const [remoteList, setRemoteList] = useState(new Array<string>())

    const [peer, setPeer] = useState<undefined | Peer>();
    const [transmissionType, setTransmissionType] = useState("web");
    const [mediaStream, setMediaStream] = useState<undefined | MediaStream>();
    const [vmcStream, setVMCStream] = useState<undefined | VMCStreamer>();
    const videoRef = useRef(null);
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    const [audioIn, setAudioIn] = useState("");
    const [videoIn, setVideoIn] = useState("");
    const [connMap, updateConnMap] = useReducer(connMapUpdater, new Map<string, client>());

    function updatePeer(peer: undefined | Peer){
        if (peer === undefined) return;
        if (peer.open)
            setMyID(peer.id)
        else
            peer.addListener("open", (id) => setMyID(id));
        setPeer(peer);
    }

    function newPeerConnection(dc: DataConnection){
        if (dc.peer == peer?.id) {
            dc.addListener("open", () => dc.close())
            return;
        }
        if (dc.label !== "init" && !remoteList.find((val) => val == dc.peer)){
            remoteList.push(dc.peer);
            setRemoteList([...remoteList]);
            dc.addListener("close", () => {
                const index = remoteList.indexOf(dc.peer);
                if (index > -1) remoteList.splice(index, 1);
                setRemoteList([...remoteList])
            });
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
    }, [peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <p>List: {remoteList.toString()}</p>
        {/* Add check here for established data connection? */}
        <MediaSelection audioIn={audioIn} setAudioIn={setAudioIn} videoIn={videoIn} setVideoIn={setVideoIn}/>
        <TransmissionSelector transmissionType={transmissionType} setTransmissionType={setTransmissionType} />
        <VideoPreview videoRef={videoRef} mediaStream={mediaStream} />
        {
            transmissionType === "web" ? 
                <VMCComponent mediaStream={mediaStream} videoRef={videoRef} vmcStream={vmcStream} setVMCStream={setVMCStream} />
            :
                undefined
        }
        {mediaStream ? 
            <MediaStreamEnder mediaStream={mediaStream} setMediaStream={setMediaStream} />
        :
            <MediaStreamStarter setMediaStream={setMediaStream} audioIn={audioIn} videoIn={videoIn} />
        }
        <div id='Log' className='top-1 overflow-auto flex-1'>
            {
                log.map((ele) => {
                    return <p className='h-20 text-center bottom-1' key={ele}>{ele}</p>
                })
            }
        </div>
        {
            remoteList.map((remote) => <Transmitter key={remote} transmissionType={transmissionType} peer={peer} remote={remote} mediaStream={mediaStream} vmcStream={vmcStream} />)
        }
        <MediaRecv peer={peer}/>
    </div>)
}
