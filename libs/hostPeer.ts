import Peer, { DataConnection, MediaConnection, PeerError } from "peerjs";

export default class hostPeer extends Peer{
    connMap: Map<Peer["id"], {
        dataConn: DataConnection | undefined, 
        mediaConn: MediaConnection | undefined
    }>
    // dataConn: DataConnection | undefined
    // mediaConn: MediaConnection | undefined
    
    constructor(){
        super({
            host:"localhost",
            port:9000,
            path:"/"
        });
        this.connMap = new Map();
        this.on("open", hostPeer.onOpen);
        this.on("error", hostPeer.onError);
        this.on("close", hostPeer.onClose);
        this.on("disconnected", this.onDisconnect);

        // this.on("connection", this.dataConnOpen)
        // this.on("call", this.mediaConnOpen)
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
    
    // Data Connection Functions
    dataConnOpen(dataConn: DataConnection) {
        console.log("a data connection has opened");
        if(this.connMap.has(dataConn.peer)){
            this.connMap.get(dataConn.peer)!.dataConn = dataConn
        } else {
            this.connMap.set(dataConn.peer, {dataConn: dataConn, mediaConn: undefined})
        }
        dataConn.on("open", ()=> {
            console.log("dataConn Opened")
            dataConn.send("Data Connection Established")
        })
        // this.dataConn = dataConn;
    }
    
    static dataConnClose() {
        console.log("a data connection was closed");
    }

    mediaConnOpen(mediaConn: MediaConnection){
        console.log("a media Connection has opened");
        mediaConn.answer();
        if(this.connMap.has(mediaConn.peer)){
            this.connMap.get(mediaConn.peer)!.mediaConn = mediaConn
        } else {
            this.connMap.set(mediaConn.peer, {dataConn: undefined, mediaConn: mediaConn})
        }

        this.connMap.get(mediaConn.peer)?.dataConn?.send("Media Connection Established")
        // this.mediaConn = mediaConn;
    }

    static mediaConnClose(){
        console.log("a media Connection was close");
    }
}