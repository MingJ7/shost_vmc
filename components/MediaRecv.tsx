"use client"
import hostPeer from '@/libs/hostPeer';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import React, { MutableRefObject, useEffect, useReducer, useRef, useState } from 'react';
import { VMCStreamer, convertStream } from './MediapipeSlover';

type client = {
    dataConn: DataConnection,
    mediaConn: MediaConnection | undefined
}

function connMapUpdater(state: Map<string, client>, action: {type: string, dataConn?: DataConnection, mediaConn?: MediaConnection}){
    if (action.dataConn === undefined && action.mediaConn === undefined) return state;

    const newConnMap = new Map(state);
    const connID = action.dataConn?.peer ?? action.mediaConn?.peer ?? ""
    if (action.type === "ADD"){
        if (action.dataConn){
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                newConnMap.get(connID)!.dataConn?.close();
                newConnMap.get(connID)!.dataConn = action.dataConn;
            } else {
                // create a new entry
                newConnMap.set(connID, {dataConn: action.dataConn, mediaConn: undefined});
            }
        } else {
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                newConnMap.get(connID)!.mediaConn?.close();
                newConnMap.get(connID)!.mediaConn = action.mediaConn;
                // if (!action.mediaConn?.open) action.mediaConn?.answer()
            } else {
                // reject the call if there is no data stream
                console.log("call rejected")
                action.mediaConn?.close()
            }
        }
    } else if (action.type === "REMOVE"){
        if (action.dataConn){
            newConnMap.get(connID)?.dataConn?.close();
            // newConnMap.get(connID)?.mediaConn?.close();
            newConnMap.delete(connID)
        } else {
            newConnMap.get(connID)?.dataConn.send("Media Connection Closed")
            // newConnMap.get(connID)?.mediaConn?.close();
            // if (action.mediaConn === newConnMap.get(connID)?.mediaConn)
            //     delete newConnMap.get(connID)?.mediaConn;
        }
    }
    console.log(newConnMap)
    return newConnMap;
}

export default function MediaRecv() {
    const [peer, setPeer] = useState<undefined | Peer>(undefined);
    const [myID, setMyID] = useState("")

    const [connMap, updateConnMap] = useReducer(connMapUpdater, new Map<string, client>())
    const [log, updateLog] = useReducer((state: Array<string>, newMsg: string) => {
        return [...state, newMsg]
    }, new Array<string>())
    
    const newDataConn = (dataConn: DataConnection) => {
        console.log("react callback connection");
        updateConnMap({type: "ADD", dataConn:dataConn})
        updateLog("Connected to peer: " + dataConn.peer)
        dataConn.on("close", () => {
            updateConnMap({type: "REMOVE", dataConn:dataConn})
        })
    }

    const newMediaConn = (mediaConn: MediaConnection) => {
        console.log("react callback call");
        updateConnMap({type:"ADD", mediaConn:mediaConn})
        updateLog("Stream from peer: " + mediaConn.peer)
        updateLog("Connection ID: " + mediaConn.connectionId)
        let temp = mediaConn.remoteStream
        mediaConn.on("stream", (stream) => {
            if (temp === stream) {console.log("same stream added"); return;}
            updateLog("stream added for " + mediaConn.connectionId)
            console.log("stream has been added")
            temp = stream;
        })
        mediaConn.on("close", () => {
            updateConnMap({type: "REMOVE", mediaConn:mediaConn})
        })
        mediaConn.answer()
    }

    function setup(){
        console.log("setup is run");
        const newPeer = new hostPeer();
        newPeer.on('open', () => setMyID(newPeer.id));
        newPeer.on('connection', newDataConn);
        newPeer.on('call', newMediaConn);
        
        setPeer(newPeer);
        return function cleanup() {
            peer?.destroy()
            setPeer(undefined)
        }
    }

    useEffect(setup, [])
    console.log("render")
    return (<div>
        <h1>{myID}</h1>
        <a href={'http://localhost:3000/join/' + myID}>Join</a>
        <div id='Log' className='top-1 overflow-auto flex-1'>
            {
                log.map((ele, idx) => {
                    return <p className='h-20 text-center bottom-1' key={idx}>{ele}</p>
                })
            }
        </div>
        {
            Array.from(connMap).map(([id, client], idx) => (
                <div key={id}>
                    <p>Peer {idx}: {id}</p>
                    <p>{client.dataConn.connectionId}</p>
                    <p>{client.mediaConn?.connectionId}</p>
                    {/* <p>{client.mediaConn?.remoteStream.id}</p> */}
                    <Preview mediaStream={client.mediaConn?.remoteStream}/>
                </div>
            ))
        }
    </div>)
}

function Preview ({mediaStream}: {mediaStream: MediaStream | undefined}){
    const [preview, setPreview] = useState(false);
    const [vmcStream, setVMCStream] = useState<VMCStreamer | undefined>()
    const videoRef = useRef(null)
    const [volume, setVolume] = useState(1);

    function updateVolume(vol: number){
        const videoElement = videoRef.current as unknown as HTMLVideoElement;
        videoElement.volume = volume;
        setVolume(vol);
    }

    function togglePlay(){
        const videoElement = videoRef.current as unknown as HTMLVideoElement;
        if (videoElement.paused) videoElement.play();
        else videoElement.pause();
    }

    useEffect(function updatePreview(){
        console.log("Update Preview", mediaStream)
        if (mediaStream) {
            const videoElement = videoRef.current;
            console.log("EffectVideo", videoElement);
            if(videoElement) {
                const newVMCStream = new VMCStreamer(videoElement, mediaStream);
                setVMCStream(newVMCStream);
            }
            
        }
        return function cleanup() {}
    }, [mediaStream])

    return (
        <div>
            <video id={'videoPreview' + mediaStream?.id} autoPlay={true} hidden={!preview} ref={videoRef}></video>
            {
                preview ?
                <button onClick={() => setPreview(false)}>Off Preview</button>
                :
                <button onClick={() => setPreview(true)}>Preview</button>
            }
            {/* Only show Stream control buttons once the stream is created */}
            {
                vmcStream ? 
                <div>
                    <AudioOutputSelector videoRef={videoRef}/>
                    <input type='range' max={1} min={0} step={0.01} onChange={(evt) => updateVolume(Number(evt.target.value))} value={volume}></input>
                    <button onClick={togglePlay}>Toggle state</button>
                    <button onClick={(evt) => vmcStream.resetPose()}>Reset Pose</button>
                </div>
                :
                null
            }
        </div>
    )
}

function AudioOutputSelector({videoRef}: {videoRef: MutableRefObject<null>}) {
    
    const [audioOutDevices, setAudioOutDevices] = useState(new Array<MediaDeviceInfo>())
    const [audioOut, setAudioOut] = useState("")
    
    function gotDevices(deviceInfos: Array<MediaDeviceInfo>) {
        const newAudioList = new Array<MediaDeviceInfo>()
        for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audiooutput') {
                // console.log('Audio Input: ', deviceInfo);
                newAudioList.push(deviceInfo);
            } else {
                // console.log('Some other kind of source/device: ', deviceInfo);
            }
        }
        setAudioOutDevices(newAudioList);
        setAudioOut(newAudioList[0].deviceId)
    }
    
    function handleError(error: Error) {
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }

    function updateAudioOut(deviceID: string){
        setAudioOut(deviceID)
        if (videoRef.current){
            // Experimental features, defination not in typescript
            if(videoRef.current.sinkId !== 'undefined'){
                videoRef.current.setSinkId(deviceID) .then(() => {
                    console.log(`Success, audio output device attached: ${deviceID} to element with as source.`);
                  })
                  .catch((error: Error) => {
                    let errorMessage = "error";
                    if (error.name === 'SecurityError') {
                      errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                    }
                    console.error(errorMessage);
                    // Jump back to first output device in the list as it's the default.
                    setAudioOut(audioOutDevices[0].deviceId)
                  });
            }
        }
    }

    useEffect(function startup(){
        navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
        return function cleanup(){}
    }, [])

    return <div className='flex'>
        <p>Output:</p>
        <select id='audioSelect' value={audioOut} onChange={evt => updateAudioOut(evt.target.value)}>
        {
            audioOutDevices.map((device) => (
                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
            ))
        }
        </select>
    </div>
}