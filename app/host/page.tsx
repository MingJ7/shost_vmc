"use client"
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const MediaRecv = dynamic(() => import("@/components/MediaRecv"), {ssr: false})

export default function Component() {
    const [myID, setMyID] = useState("");

    return (<div>
        <h1>Your id is {myID}</h1>
        
        <MediaRecv/>
    </div>)
}
