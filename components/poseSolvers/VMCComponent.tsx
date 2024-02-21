"use client"
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { VMCStreamer } from "./MediapipeSlover";

export default function VMCComponent ({mediaStream, vmcStream, setVMCStream, videoRef}: {mediaStream: MediaStream | undefined, vmcStream: undefined | VMCStreamer, setVMCStream: (vmcStreamer: undefined | VMCStreamer) => void, videoRef: MutableRefObject<null| HTMLVideoElement>}){
    const [armRotation, setArmRotation] = useState(Math.PI/4);
    
    function updateArmRotation(armRotation: number){
        vmcStream?.setArmRotation(-armRotation);
        setArmRotation(armRotation);
    }

    useEffect(function setupVMC(){
        var newVMCStream: undefined | VMCStreamer;
        console.log("media Stream is now:", mediaStream)
        if (mediaStream && videoRef.current){
            const videoElement = videoRef.current as HTMLVideoElement;
            newVMCStream = new VMCStreamer(videoElement, mediaStream);
            newVMCStream.setArmRotation(-armRotation);
            setVMCStream(newVMCStream);
        }

        return function cleanup(){
            newVMCStream?.release();
            setVMCStream(undefined);
        }
    }, [mediaStream, videoRef])

    return (
        <div>
            {/* Only show Stream control buttons once the stream is created */}
            {
                vmcStream ? 
                <div>
                    VMC Controls<br/>
                    {/* <AudioOutputSelector videoRef={videoRef}/> */}
                    {/* <input type='range' max={1} min={0} step={0.01} onChange={(evt) => updateVolume(Number(evt.target.value))} value={volume}></input> */}
                    <input type='range' max={Math.PI*2} min={0} step={Math.PI/180} onChange={(evt) => updateArmRotation(Number(evt.target.value))} value={armRotation}></input>
                    <button onClick={(evt) => vmcStream.resetPose()}>Reset Pose</button>
                </div>
                :
                null
            }
        </div>
    )
}
