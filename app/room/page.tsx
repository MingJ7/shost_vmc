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

const PeerComponent = dynamic(() => import("../../components/PeerComponent"), {ssr: false})
const VMCComponent =  dynamic(() => import("../../components/poseSolvers/VMCComponent"), {ssr: false})

export default function Component() {
    const [myID, setMyID] = useState("");
    const [hosturl, setHosturl] = useState("");
    const [remoteList, setRemoteList] = useState(new Array<string>())

    const [peer, setPeer] = useState<undefined | Peer>();
    const [transmissionType, setTransmissionType] = useState("web");
    const [mediaStream, setMediaStream] = useState<undefined | MediaStream>();
    const [vmcStream, setVMCStream] = useState<undefined | VMCStreamer>();
    const videoRef = useRef(null);
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    const [audioIn, setAudioIn] = useState("web");
    const [videoIn, setVideoIn] = useState("web");

    function updatePeer(peer: undefined | Peer){
        if (peer === undefined) return;
        if (peer.open)
            setMyID(peer.id)
        else
            peer.addListener("open", (id) => setMyID(id));
        setPeer(peer);
    }

    // As this is a named function, it will not take the new remoteList after sate updates
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
                dc.send({type:"init", remoteList: remoteList})
            )
        }
    }
    
    useEffect(()=>{
        setHosturl(window.location.protocol + "//" + window.location.host);
    }, [])

    useEffect(()=>{
        peer?.addListener("connection", newPeerConnection);
        return function cleanup(){
            peer?.removeListener("connection", newPeerConnection);
        }
    }, [peer])

    return (<div>
        <PeerComponent peer={peer} setPeer={updatePeer}/>
        <p>Share the for others to join</p>
        <a href={hosturl + "/jointVMC/room/" + myID}>
            {hosturl + "/jointVMC/room/" + myID}
        </a>
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
