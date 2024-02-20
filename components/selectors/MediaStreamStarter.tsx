import { handleError } from "./helper";

export function MediaStreamStarter({videoIn, audioIn, setMediaStream}: {videoIn: string, audioIn:string, setMediaStream: (arg0: undefined | MediaStream) => void}){
    
    function gotStream(stream: MediaStream) {
        setMediaStream(stream);
        console.log("new Stream", stream)
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

    return <button onClick={start}>Start</button>
}