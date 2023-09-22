"use client"
import { MutableRefObject, useEffect, useState } from "react";

export function AudioOutputSelector({videoRef}: {videoRef: MutableRefObject<null>}) {
    
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
        const video = videoRef.current as any // as HTMLVideoElement // to stop typescript errors
        if (video){
            // sinkId Experimental features, defination not in typescript
            if(video.sinkId !== 'undefined'){
                video.setSinkId(deviceID) .then(() => {
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