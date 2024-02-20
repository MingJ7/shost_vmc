export function MediaStreamEnder({mediaStream, setMediaStream}: {mediaStream: MediaStream, setMediaStream: (arg0: undefined | MediaStream) => void}){
    
    function stop(){
        mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        setMediaStream(undefined)
    }

    return <button onClick={stop}>Stop</button>
}