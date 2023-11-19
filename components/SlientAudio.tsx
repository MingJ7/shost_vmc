"use client"

import { ChangeEvent, useRef, useState } from "react"

export default function SlientAudio(){
    const [play, setPlay] = useState(false);
    const audioPlayer = useRef(null);

    function handleChange(evt: ChangeEvent<HTMLInputElement>){
        const player = audioPlayer.current as unknown as HTMLAudioElement
        setPlay(evt.target.checked);
        if (evt.target.checked === true){
            player.play();
        } else{
            player.pause();
        }
    }

    return <div>
        <input type="checkbox" value="play" checked={play} onChange={handleChange}/>Keep Tab Alive
        <audio src={new URL("../public/sound_of_silence.mp3", import.meta.url).toString()} loop ref={audioPlayer}></audio>
    </div>
}