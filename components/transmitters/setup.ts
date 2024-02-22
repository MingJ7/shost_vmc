import Peer, { DataConnection, MediaConnection } from "peerjs";

// Data Connection set up
export function setupPeer(peer: Peer, remoteID: string, setConn: (dc: DataConnection) => void){
    console.log("client:", peer.id);
    const c = peer?.connect(remoteID);
    c.on("open",() => {
        // only assign the connection on connected
        setConn(c);
    })
    c.on('data', (raw) => {
        if (typeof raw === "string") {}
            // setLog([...log, raw]);
        else if (raw instanceof Object){
            const datastr = JSON.stringify(raw);
            const data = raw as any;
            if (data.type === "ping"){
                c.send({type:"pong"});
            }
        }
    });

    return function cleanup() {
        c.close();
    }
}

export function streamSetup(transmissionType: string, peer: Peer | undefined, conn: DataConnection | undefined, mediaStream: MediaStream | undefined, remoteID: string){
    if (transmissionType !== "video") return;
    let mediaConnection: MediaConnection;
    if(peer && conn && mediaStream){
        mediaConnection = peer.call(remoteID, mediaStream);
    }

    return function cleanup(){
        if (mediaConnection) mediaConnection.close();
    }
}