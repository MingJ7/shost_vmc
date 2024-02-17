"use client"
import { useEffect, useState } from "react"
import { promptPermission } from "./helper"

const noAudio: MediaDeviceInfo = {
    deviceId: "null",
    groupId: "null",
    kind: "audioinput",
    label: "No Audio",
    toJSON: () => "",
}

export function MediaSelection({setMediaStream}: {setMediaStream: (arg0: MediaStream | undefined) => void}) {
    const [videoInDevices, setVideoInDevices] = useState(new Array<MediaDeviceInfo>())
    const [audioInDevices, setAudioInDevices] = useState(new Array<MediaDeviceInfo>())
    const [videoIn, setVideoIn] = useState("")
    const [audioIn, setAudioIn] = useState("")
    const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | undefined>()
    
    const [preview, setPreview] = useState(false);

    function gotDevices(deviceInfos: Array<MediaDeviceInfo>) {
        const newAudioList = new Array<MediaDeviceInfo>()
        const newVideoList = new Array<MediaDeviceInfo>()
        newAudioList.push(noAudio);
        for (let i = 0; i !== deviceInfos.length; ++i) {
            if (deviceInfos[i].deviceId === '') {
                promptPermission().then(() => navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError));
                return;
            }
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audioinput') {
                console.log('Audio Input: ', deviceInfo);
                newAudioList.push(deviceInfo);
            } else if (deviceInfo.kind === 'videoinput') {
                console.log('Video Input: ', deviceInfo);
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
        const constraints: any = {
            video: { deviceId: videoSource ? { exact: videoSource } : undefined }
        };
        if (audioSource !== "null") 
            constraints.audio= { deviceId: audioSource ? { exact: audioSource } : undefined },
        console.log(constraints);
        navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
    }

    function stop(){
        if (activeMediaStream) {
            activeMediaStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        setActiveMediaStream(undefined)
        setMediaStream(undefined)
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
                    audioInDevices.map((device, idx) => (
                        <option value={device.deviceId} key={device.deviceId}>{device.label || "Device #" + idx}</option>
                    ))
                }
            </select>
            <p>Choose Video Device</p>
            <select id='videoSelect' value={videoIn} onChange={evt => setVideoIn(evt.target.value)}>
                {
                    videoInDevices.map((device, idx) => (
                        <option value={device.deviceId} key={device.deviceId}>{device.label || "Device #" + idx}</option>
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
                    <button onClick={start}>Start</button>
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