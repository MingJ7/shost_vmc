"use client"
import dynamic from 'next/dynamic';

const MediaRecv = dynamic(() => import("../../components/MediaRecv"), {ssr: false})

export default function Component() {
    return (<div>
        <MediaRecv/>
    </div>)
}
