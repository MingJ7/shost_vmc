import { DataConnection, MediaConnection } from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { VMCStreamer, WStrasmitLink } from '../poseSolvers/MediapipeSlover';
import dynamic from 'next/dynamic';
import VideoPreview from '../previews/VideoPreview';

const VMCComponent =  dynamic(() => import("../poseSolvers/VMCComponent"), {ssr: false})

type client = {
    dataConn: DataConnection,
    mediaConn: MediaConnection | undefined
}
const DEFUALTPORT = 35749;

export function ClientConnection({cl}: {cl: client}){
    const [passthrough, setpassthrough] = useState(true);
    const [rtt, setRTT] = useState(-1);
    const [port, setPort] = useState(DEFUALTPORT);
    const [vmcStream, setVMCStream] = useState<undefined | VMCStreamer>();
    const videoRef = useRef(null);
    const [wsLinker, setwsLinker] = useState(() => new WStrasmitLink(port));

    function updatePort(port: number){
        if (port < 1024) port = 1024;
        wsLinker.setPort(port);
        setPort(port);
    }

    useEffect(function SetupDC(){
        console.log("setting up dc")
        var pingTime: number = 0;
        function GetRTT(){
            pingTime = performance.now()
            cl.dataConn.send({type:"ping"});
        }
        var pingIntervalID: NodeJS.Timeout;
        if (cl.dataConn.open){
            pingIntervalID = setInterval(GetRTT, 1000);
        }else{
            cl.dataConn.addListener("open", () => {
                pingIntervalID = setInterval(GetRTT, 1000);
            });
        }

        function parseMsg(msg: unknown){
            var data: any
            if (typeof msg === "string")
                data = JSON.parse(msg as string);
            else
                data = msg
            switch(data.type){
                case "pong":
                    setRTT(performance.now() - pingTime);
                    break;
                case "setting":
                    setpassthrough(data.data.passthrough)
                    break;
                case "message":
                    console.log(data.msg);
                    break;
                case "motionData":
                    if (passthrough){
                        wsLinker.send(data.data)
                    }
                    break;
                default:
                    console.log("error reading data")
            }
        }
        cl.dataConn.addListener("data", parseMsg);

        return function CleanupDC(){
            if (pingIntervalID){
                clearInterval(pingIntervalID);
            }
            cl.dataConn.removeListener("data", parseMsg)
        }
    }, [cl])

    useEffect(function addListenerForSolver(){
        vmcStream?.addListener("data", (data: Buffer) => {
            if (cl.dataConn?.open){
                cl.dataConn.send({type:"motionData", data: data})
            }
        })
    }, [vmcStream])

    return <div style={{border:"3px solid black"}}>
        <input type='number' onChange={(evt) => updatePort(parseInt(evt.target.value))} value={port}></input>
        <button
            onClick={() => {cl.dataConn.close(); cl.mediaConn?.close();}}
            style={{border:"1px solid black"}}
        >Disconnect</button>
        <br/>
        RTT: {rtt} ms
        <br/>
        {
            passthrough ?
                <p>Forwarding Motion Data</p>
            :
            <div>
                Computing from Video<br/>
                <VideoPreview mediaStream={cl.mediaConn?.remoteStream} videoRef={videoRef} />
                <VMCComponent mediaStream={cl.mediaConn?.remoteStream} videoRef={videoRef} vmcStream={vmcStream} setVMCStream={setVMCStream} />
            </div>
        }

    </div>
}