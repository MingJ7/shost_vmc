"use client"
import clientPeer from '@/libs/clientPeer';
import Peer, { DataConnection } from 'peerjs';
import { useEffect, useState } from 'react';



export default function MediaStreamer({remoteID, mediaStream}: {remoteID: string, mediaStream: MediaStream}) {
    const [peer, setPeer] = useState<undefined | clientPeer>();
    const [conn, setConn] = useState<undefined | DataConnection>();
    
    const [log, setLog] = useState(new Array<string>())
    
    function setup(){
        const newPeer = new clientPeer();
        newPeer.on("open", () => {
            const c = newPeer.connect(remoteID);
            c.on("open",() => {
                const d = newPeer.call(remoteID, mediaStream);
            })
            c.on('data', (data: any) => {
                setLog([...log, data]);
            })
            setConn(c);

        })
        
        setPeer(newPeer)

        return function cleanup(){
            conn?.close();
            // d.close();
            newPeer.destroy();
            setPeer(undefined);
            setConn(undefined);
            console.log("cleanup done")
        }
    }
    useEffect(setup, [])
    
    return (<div>
        <div id='Log' className='top-1 overflow-auto flex-1'>
            {
                log.map((ele) => {
                    return <p className='h-20 text-center bottom-1' key={ele}>{ele}</p>
                })
            }
        </div>
    </div>)
}
