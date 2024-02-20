"use client"
import { useEffect, useState } from "react"
import { handleError, promptPermission } from "./helper"

const noAudio: MediaDeviceInfo = {
    deviceId: "null",
    groupId: "null",
    kind: "audioinput",
    label: "No Audio",
    toJSON: () => "",
}

export function MediaSelection({videoIn, audioIn, setVideoIn, setAudioIn}: {videoIn: string, audioIn:string, setVideoIn: (arg0: string) => void, setAudioIn: (arg0: string) => void}) {
    const [videoInDevices, setVideoInDevices] = useState(new Array<MediaDeviceInfo>())
    const [audioInDevices, setAudioInDevices] = useState(new Array<MediaDeviceInfo>())

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

    useEffect(function startup(){
        navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
        return function cleanup(){}
    }, [])

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
        </div>
    )
}