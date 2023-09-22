"use client"
import { useEffect, useRef, useState } from "react";
import { VMCStreamer } from "./MediapipeSlover";
import { AudioOutputSelector } from "./selectors/output";

export function Preview ({mediaStream}: {mediaStream: MediaStream | undefined}){
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
