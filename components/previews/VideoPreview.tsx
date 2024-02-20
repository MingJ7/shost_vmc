"use client"
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { VMCStreamer, WRTCclientLink } from "../poseSolvers/MediapipeSlover";
import { AudioOutputSelector } from "../selectors/output";
import { DataConnection } from "peerjs";

export default function VideoPreview ({mediaStream, videoRef}: {mediaStream: MediaStream | undefined, videoRef: MutableRefObject<null | HTMLVideoElement>}){
    const [preview, setPreview] = useState(false);
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
            if (videoElement)
                videoElement.srcObject = mediaStream;
            console.log("EffectVideo", videoElement);
        }
        return function cleanup() {}
    }, [mediaStream, videoRef])

    return (
        <div>
            <video id={'videoPreview' + mediaStream?.id} autoPlay={true} hidden={!preview} ref={videoRef}></video>
            <button onClick={() => setPreview(!preview)}>{preview ? "Hide Video" : "Display Video"}</button>
        </div>
    )
}
