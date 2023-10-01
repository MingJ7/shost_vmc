"use client"
import { useEffect, useRef, useState } from "react";
import { VMCStreamer } from "./MediapipeSlover";
import { AudioOutputSelector } from "./selectors/output";

export function Preview ({mediaStream}: {mediaStream: MediaStream | undefined}){
    const [preview, setPreview] = useState(false);
    const [vmcStream, setVMCStream] = useState<VMCStreamer | undefined>()
    const videoRef = useRef(null)
    const [volume, setVolume] = useState(1);
    const [port, setPort] = useState(35750);
    const [armRotation, setArmRotation] = useState(Math.PI/4);
    
    function updateArmRotation(armRotation: number){
        vmcStream?.setArmRotation(-armRotation);
        setArmRotation(armRotation);
    }

    function updatePort(port: number){
        if (port < 1024) port = 1024;
        vmcStream?.setPort(port);
        setPort(port);
    }

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
        var newVMCStream: undefined | VMCStreamer;
        if (mediaStream) {
            const videoElement = videoRef.current;
            console.log("EffectVideo", videoElement);
            if(videoElement) {
                newVMCStream = new VMCStreamer(videoElement, mediaStream);
                newVMCStream.setArmRotation(-armRotation);
                newVMCStream.setPort(port)
                setVMCStream(newVMCStream);
            }
            
        }
        return function cleanup() {
            newVMCStream?.release();
        }
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
                    <input type='range' max={Math.PI*2} min={0} step={Math.PI/180} onChange={(evt) => updateArmRotation(Number(evt.target.value))} value={armRotation}></input>
                    <input type='number' onChange={(evt) => updatePort(parseInt(evt.target.value))} value={port}></input>
                    <button onClick={togglePlay}>Toggle state</button>
                    <button onClick={(evt) => vmcStream.resetPose()}>Reset Pose</button>
                </div>
                :
                null
            }
        </div>
    )
}
