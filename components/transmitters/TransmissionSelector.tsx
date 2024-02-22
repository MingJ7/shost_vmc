"use client"
import { DataConnection } from 'peerjs';
import { useState } from 'react';
import { EventEmitter } from "events";

export default function TransmissionSelector({ transmissionType, setTransmissionType }: { transmissionType: string, setTransmissionType: (type: string) => void}) {

    return (<div>
        <select id='transmitSelect' value={transmissionType} onChange={evt => setTransmissionType(evt.target.value)}>
            <option value="video">Send video (peer compute)</option>
            <option value="web">Send tracking (browser compute)</option>
            <option value="host">Send tracking (external compute)</option>
        </select>
    </div>)
}
