import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { Face, TFace, Vector } from "kalidokit";
import Quaternion from "quaternion";
import osc from "osc-min";

let faceLandmarker: FaceLandmarker;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: false,
    runningMode: "VIDEO",
    numFaces: 1
  });
}

createFaceLandmarker();
// const oscPort = new osc.WebSocketPort({url: "ws://localhost:8765"})
// oscPort.open();
const sock = new WebSocket("ws://localhost:8765")


/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
export function convertStream(videoEle: HTMLVideoElement, stream: MediaStream) {
  // slove the stream?
  videoEle.srcObject = stream;
  videoEle.addEventListener("loadeddata", () => predictWebcam(videoEle, stream, new Vector([0, 0, 0]), -1))
}

export async function predictWebcam(videoEle: HTMLVideoElement, stream: MediaStream, baseNeckRotaion: Vector, prevTime: DOMHighResTimeStamp) {
  console.log("prevTime:", prevTime)
  const timeNow = performance.now()
  console.log("currentTime:", timeNow)
  // Now let's start detecting the stream.
  if (prevTime !== timeNow) {
    console.log("upadtaing time:", prevTime, " to ", timeNow)
    prevTime = timeNow;
    const mpResults = faceLandmarker.detectForVideo(videoEle, timeNow);
    if (mpResults.faceLandmarks[0]) {
      const kaliFace = Face.solve(mpResults.faceLandmarks[0], {
        runtime: "mediapipe",
        video: videoEle,
      })
      if (kaliFace) {
        // removeBasePose(kaliFace, baseNeckRotaion)
        // kaliFaceToVMC(kaliFace)
      }
      console.log(prevTime, "results: ", kaliFace)
    }
  }

  // if (videoEle.title === "Defualt"){
  //   defualtPose = "The defualt pose"
  // }
  // Call this function again to keep predicting when the browser is ready.
  // if (videoEle.paused){
  //   if(videoEle.onplay){
  //     const restartPrediction = () =>{
  //       predictWebcam(videoEle, stream, performance.now())
  //       videoEle.removeEventListener("play", restartPrediction)
  //     }
  //     videoEle.addEventListener("play", restartPrediction)
  //   }
  // } else 
  if (stream.active && !videoEle.paused) {
    window.requestAnimationFrame((newTimeNow) => predictWebcam(videoEle, stream, baseNeckRotaion, newTimeNow));
  }
}

export class VMCStreamer {
  video: HTMLVideoElement;
  stream: MediaStream;
  sock: WebSocket;
  faceLandmarker: FaceLandmarker | undefined;
  baseNeckRotation: Vector;
  upperArmRotation: Vector;
  updateBase: boolean;

  constructor(video: HTMLVideoElement, stream: MediaStream) {
    this.video = video;
    this.stream = stream;
    this.sock = new WebSocket("ws://localhost:8765");
    this.baseNeckRotation = new Vector(0, 0, 0);
    this.upperArmRotation = new Vector(0, 0, 0);
    this.updateBase = false;
    this.video.srcObject = this.stream;

    VMCStreamer.createFaceLandmarker().then((faceLandmarker) => this.faceLandmarker = faceLandmarker)
    this.video.onplay = () => this.detection(-1);
  }

  async detection(prevTime: DOMHighResTimeStamp) {
    const timeNow = performance.now()
    // Now let's start detecting the stream.
    if (prevTime !== timeNow) {
      prevTime = timeNow;
      if (this.faceLandmarker) {
        const mpResults = this.faceLandmarker.detectForVideo(this.video, timeNow);
        if (mpResults.faceLandmarks[0]) {
          const kaliFace = Face.solve(mpResults.faceLandmarks[0], {
            runtime: "mediapipe",
            video: this.video,
          })
          if (kaliFace) {
            if (this.updateBase) this.updateBaseNeckRotation(kaliFace);
            VMCStreamer.adjustNeckPose(kaliFace, this.baseNeckRotation);
            const vmcMsgs = VMCStreamer.kaliFaceToVMC(kaliFace, this.upperArmRotation.z);
            this.transmitVMC(vmcMsgs);
          }
          console.log(prevTime, "results: ", kaliFace)
        }
      }
    }
    // If the stream is active and video not paused
    // Queue Calculations for next window refresh
    if (this.stream.active && !this.video.paused) {
      window.requestAnimationFrame((newTimeNow) => this.detection(newTimeNow));
    }
  }

  transmitVMC(VMCData: Buffer){
    if(this.sock.OPEN){
      sock.send(VMCData)
    } else if (sock.CLOSED || sock.CLOSING){
      // Create new connection is prev one is closed
      // this.sock = new WebSocket("ws://localhost:8765");
      console.log("Failed to send data, Websocket is Closed")
    }
  }

  resetPose(){
    console.log(this);
    console.log(this.updateBase);
    this.updateBase = true;
  }

  setArmRotation(zRad: number){
    this.upperArmRotation.z = zRad;
  }

  updateBaseNeckRotation(kaliFace:TFace){
    this.baseNeckRotation.x = kaliFace.head.x;
    this.baseNeckRotation.y = kaliFace.head.y;
    this.baseNeckRotation.z = kaliFace.head.z;
    this.updateBase = false;
  }

  static adjustNeckPose(detectedFace: TFace, baseNeckRotation: Vector) {
    detectedFace.head.x = baseNeckRotation.x - detectedFace.head.x;
    detectedFace.head.y = baseNeckRotation.y - detectedFace.head.y;
    detectedFace.head.z = baseNeckRotation.z - detectedFace.head.z;
  }

  static kaliFaceToVMC(kaliFace: TFace, armRot: number){
    const boneTransforms = []
    // Neck 
    const neckQuat = Quaternion.fromEulerLogical(kaliFace.head.x, kaliFace.head.y, kaliFace.head.z, "XYZ")
    boneTransforms.push(["Neck", 0.1, 0.1, 0.1, neckQuat.x, neckQuat.y, neckQuat.z, neckQuat.w])
    // Arms 
    const rUprArmQuat = Quaternion.fromEulerLogical(0, 0, armRot, "XYZ")
    boneTransforms.push(["RightUpperArm", 0.1, 0.1, 0.1, rUprArmQuat.x, rUprArmQuat.y, rUprArmQuat.z, rUprArmQuat.w])
    const lUprArmQuat = Quaternion.fromEulerLogical(0, 0, -armRot, "XYZ")
    boneTransforms.push(["LeftUpperArm", 0.1, 0.1, 0.1, lUprArmQuat.x, lUprArmQuat.y, lUprArmQuat.z, lUprArmQuat.w])
    //blend shapes
    const blendShapes = []
    blendShapes.push(["Blink_L", 1 - kaliFace.eye.l])
    blendShapes.push(["Blink_R", 1 - kaliFace.eye.r])
    blendShapes.push(["I", kaliFace.mouth.shape.I])
    blendShapes.push(["A", kaliFace.mouth.shape.A])
    blendShapes.push(["E", kaliFace.mouth.shape.E])
    blendShapes.push(["O", kaliFace.mouth.shape.O])
    blendShapes.push(["U", kaliFace.mouth.shape.U])
    const boneTranformMessages = boneTransforms.map((item) => {
      return {
        oscType: "message",
        address: "/VMC/Ext/Bone/Pos",
        args: item
      }
    })
    const blendShapeMessages = blendShapes.map((item) => {
      return {
        oscType: "message",
        address: "/VMC/Ext/Blend/Val",
        args: item
      }
    })
    const blendShapeApplyMsg = {
      oscType: "message",
      address: "/VMC/Ext/Blend/Apply",
      args: []
    }
    const completeBundle = {
      oscType: "bundle",
      timetag: null,
      elements: [...boneTranformMessages, ...blendShapeMessages, blendShapeApplyMsg]
    }
    return osc.toBuffer(completeBundle)
  }

  static async createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    return await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: false,
      runningMode: "VIDEO",
      numFaces: 1
    });
  }
}