"use client"
import TransmissionSelector from '@/components/transmitters/TransmissionSelector';
import { MediaSelection } from '@/components/selectors/input';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { useEffect, useReducer, useRef, useState } from 'react';
import { setupPeer, streamSetup } from '@/components/transmitters/setup';
import { VMCStreamer } from '@/components/poseSolvers/MediapipeSlover';
import VideoPreview from '@/components/previews/VideoPreview';
import { MediaStreamStarter } from '@/components/selectors/MediaStreamStarter';
import { MediaStreamEnder } from '@/components/selectors/MediaStreamEnder';
import Transmitter from '@/components/transmitters/Transmitter';

const PeerComponent = dynamic(() => import("../../../components/PeerComponent"), {ssr: false})
const VMCComponent =  dynamic(() => import("../../../components/poseSolvers/VMCComponent"), {ssr: false})

export default function Component() {
    const param = useParams();
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [peer, setPeer] = useState<undefined | Peer>();
    // const [dataConnection, setConn] = useState<undefined | DataConnection>();
    const [transmissionType, setTransmissionType] = useState("web");
    const [mediaStream, setMediaStream] = useState<undefined | MediaStream>();
    const [vmcStream, setVMCStream] = useState<undefined | VMCStreamer>();
    const videoRef = useRef(null);
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    const [audioIn, setAudioIn] = useState("web");
    const [videoIn, setVideoIn] = useState("web");

    
    // useEffect(function setupLog(){
    //     if(dataConnection)
    //         updateLog("Connected to host " + remote);

    //     return function cleanup() {
    //         updateLog("Disconnected from " + remote);
    //     }
    // }, [dataConnection])

    return (<div>
        <PeerComponent peer={peer} setPeer={setPeer}/>
        {/* Add check here for established data connection? */}
        <MediaSelection audioIn={audioIn} setAudioIn={setAudioIn} videoIn={videoIn} setVideoIn={setVideoIn}/>
        <TransmissionSelector transmissionType={transmissionType} setTransmissionType={setTransmissionType} />
        <Transmitter transmissionType={transmissionType} peer={peer} remote={remote} mediaStream={mediaStream} vmcStream={vmcStream} />
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
    </div>)
}
