"use client"
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { AudioOutputSelector } from "../selectors/output";

export default function VideoPreview ({mediaStream, videoRef}: {mediaStream: MediaStream | undefined, videoRef: MutableRefObject<null | HTMLVideoElement>}){
    const [preview, setPreview] = useState(false);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(true);
    
    function updateVolume(vol: number){
        const videoElement = videoRef.current as unknown as HTMLVideoElement;
        videoElement.volume = volume;
        setVolume(vol);
    }

    useEffect(function updatePreview(){
        console.log("Update Preview", mediaStream)
        if (mediaStream) {
            const videoElement = videoRef.current;
            if (videoElement){
                videoElement.srcObject = mediaStream;
                videoElement.play();
            }
            console.log("EffectVideo", videoElement);
        }
        return function cleanup() {}
    }, [mediaStream, videoRef])

    return (
        <div>
            <video className='videoPreview' autoPlay={true} hidden={!preview} ref={videoRef} muted={muted}></video>
            <div hidden={!preview}>
                Muted <input type="checkbox" checked={muted} onChange={(evt) => setMuted(evt.target.checked)} />&emsp;
                Volume: <input type='range' max={1} min={0} step={0.01} onChange={(evt) => updateVolume(Number(evt.target.value))} value={volume}></input>
                <AudioOutputSelector videoRef={videoRef}/>
            </div>
            <button onClick={() => setPreview(!preview)}>{preview ? "Hide Video" : "Display Video"}</button>
        </div>
    )
}
