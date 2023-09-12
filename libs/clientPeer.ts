import Peer, { PeerConnectOption, PeerError } from "peerjs";

export default class clientPeer extends Peer{
    constructor(){
        super({
            host:"localhost",
            port:9000,
            path:"/"
        });
        this.on("open", clientPeer.onOpen);
        this.on("error", clientPeer.onError);
        this.on("close", clientPeer.onClose);
        this.on("disconnected", this.onDisconnect);
    }

    // Peer Event Functions
    static onOpen(brokeredID: string){
        console.log("PeerSever ID: ", brokeredID);
    }

    static onError(err : PeerError<string>){
        console.log(err);
    }

    static onClose(){
        console.log("Peer closed");
    }

    onDisconnect(){
        console.log("Lost Connection to PeerServer, reconnecting...");
        this.reconnect()
    }
    
    static dataConnClose() {
        console.log("the data connection was closed");
    }

    static mediaConnClose(){
        console.log("the media Connection was close");
    }

    connect(remoteID: string, options?: PeerConnectOption | undefined){
        const c = super.connect(remoteID, options);
        c.on("open", () => {
            console.log("the data connection has opened");
        })
        c.on("close", clientPeer.dataConnClose);
        c.on("data", (data) =>{
            console.log(data);
        })
        c.on("error", clientPeer.onError);
        return c;
    }

    call(remoteID: string, mediaStr: MediaStream, options?: PeerConnectOption | undefined){
        const c = super.call(remoteID, mediaStr, options);
        c.on("close", clientPeer.mediaConnClose);
        c.on("error", clientPeer.onError);
        return c;
    }
}
