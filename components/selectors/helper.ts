function endStream(ms: MediaStream){
    ms.getTracks().forEach(track => {
        track.stop();
    });
}

function alertPermissionNeed(error: Error){
    console.log(error);
    alert("Camera and Microphone permissions needed to stream to the remote host.")
}

export function promptPermission(){
    return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(endStream).catch(alertPermissionNeed);
}

export function handleError(error: Error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}