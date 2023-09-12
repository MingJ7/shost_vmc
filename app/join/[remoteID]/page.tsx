"use client"
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const MediaStreamer = dynamic(() => import("@/components/MediaStreamer"), { ssr: false })

export default function Component() {
    const param = useParams();
    const [myID, setMyID] = useState("");
    console.log("Given peer ID:", param);
    const remote = typeof param.remoteID === "string" ? param.remoteID : param.remoteID[-1];
    const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()


    return (<div>
        <h1>Your id is {myID}</h1>
        <MediaSelection setMediaStream={setMediaStream}/>
        {
            mediaStream === undefined ?
                <p>MediaStream is undefined</p>
                :
                <MediaStreamer remoteID={remote} mediaStream={mediaStream} />
        }
    </div>)
}

function MediaSelection({setMediaStream}: {setMediaStream: (arg0: MediaStream) => void}) {
    const [videoInDevices, setVideoInDevices] = useState(new Array<MediaDeviceInfo>())
    const [audioInDevices, setAudioInDevices] = useState(new Array<MediaDeviceInfo>())
    const [videoIn, setVideoIn] = useState("")
    const [audioIn, setAudioIn] = useState("")
    const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | undefined>()
    
    const [preview, setPreview] = useState(false);

    function gotDevices(deviceInfos: Array<MediaDeviceInfo>) {
        const newAudioList = new Array<MediaDeviceInfo>()
        const newVideoList = new Array<MediaDeviceInfo>()
        for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audioinput') {
                // console.log('Audio Input: ', deviceInfo);
                newAudioList.push(deviceInfo);
            } else if (deviceInfo.kind === 'videoinput') {
                // console.log('Video Input: ', deviceInfo);
                newVideoList.push(deviceInfo);
            } else {
                // console.log('Some other kind of source/device: ', deviceInfo);
            }
        }
        setAudioInDevices(newAudioList);
        setAudioIn(newAudioList[0].deviceId)
        setVideoInDevices(newVideoList);
        setVideoIn(newVideoList[0].deviceId)
    }

    function gotStream(stream: MediaStream) {
        setActiveMediaStream(stream); // make stream available to console
        setMediaStream(stream);
        console.log("new Stream", stream)
    }

    function handleError(error: Error) {
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }

    function start() {
        stop()
        const audioSource = audioIn;
        const videoSource = videoIn;
        const constraints = {
            audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
            video: { deviceId: videoSource ? { exact: videoSource } : undefined }
        };
        navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
    }

    function stop(){
        if (activeMediaStream) {
            activeMediaStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        setActiveMediaStream(undefined)
    }

    useEffect(function startup(){
        navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
        return function cleanup(){}
    }, [])

    useEffect(function updatePreview(){
        if (preview){
            if (activeMediaStream) {
                const videoElement = document.getElementById('videoPreview') as HTMLVideoElement
                if(videoElement) videoElement.srcObject = activeMediaStream;
            }
        }
        return function cleanup() {}
    }, [preview, activeMediaStream])
    
    return (
        <div>
            <p>Choose Audio Device</p>
            <select id='audioSelect' value={audioIn} onChange={evt => setAudioIn(evt.target.value)}>
                {
                    audioInDevices.map((device) => (
                        <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
                    ))
                }
            </select>
            <p>Choose Video Device</p>
            <select id='videoSelect' value={videoIn} onChange={evt => setVideoIn(evt.target.value)}>
                {
                    videoInDevices.map((device) => (
                        <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
                    ))
                }
            </select>
            {
                activeMediaStream ? 
                <div>
                    <button onClick={stop}>Stop</button>
                </div>
                :
                <div> 
                    <button onClick={start}>Record</button>
                    <button>Record and Send</button>
                </div>
            }
            {
                // Only ask user if they want a preview if there is a media stream running
                activeMediaStream ?
                    preview ?
                    <div>
                        <video id='videoPreview' autoPlay={true}></video>
                        <button onClick={() => setPreview(false)}>Turn Preview Off</button>
                    </div>
                    :
                    <button onClick={() => setPreview(true)}>Turn Preview On</button>
                :
                null
            }
        </div>
    )
}