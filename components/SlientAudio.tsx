export default function SlientAudio(){
    return <div>
        <audio src={new URL("../public/sound_of_silence.mp3", import.meta.url).toString()} loop={true} autoPlay={true}></audio>
    </div>
}