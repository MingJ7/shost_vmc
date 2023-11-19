"use client"

import { ChangeEvent, useState } from "react"

export default function KeepAlive(){
    const [play, setPlay] = useState(false);

    function handleChange(evt: ChangeEvent<HTMLInputElement>){
        const box = evt.target
        setPlay(box.checked);
        if (box.checked)
            navigator.locks.request("alive", async () => {
                while (box.checked)
                    await new Promise(r => setTimeout(r, 2000));
            });
    }

    return <div>
        <input type="checkbox" value="play" checked={play} onChange={handleChange}/>Keep Tab Alive
    </div>
}