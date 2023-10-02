import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { Face, TFace, Vector } from "kalidokit";
import Quaternion from "quaternion";
import osc from "osc-min";
import { json } from "stream/consumers";

export class VMCStreamer {
  video: HTMLVideoElement;
  stream: MediaStream;
  framerate: number;
  port: number;
  sock: WebSocket;
  faceLandmarker: FaceLandmarker | undefined;
  baseNeckRotation: Vector;
  upperArmRotation: Vector;
  updateBase: boolean;

  constructor(video: HTMLVideoElement, stream: MediaStream) {
    this.video = video;
    this.stream = stream;
    this.framerate = stream.getVideoTracks()[0].getSettings().frameRate ?? 30;
    this.port = 35750
    this.sock = VMCStreamer.createWebSocket(this.port);
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
          // console.log(prevTime, "results: ", kaliFace)
        } 
      }
    }
    // If the stream is active and video not paused
    // Queue Calculations for next frame
    if (this.stream.active && !this.video.paused) {
      setTimeout((newTimeNow) => this.detection(newTimeNow), 1000/this.framerate);
    }
  }

  transmitVMC(VMCData: Buffer){
    if(this.sock.readyState == this.sock.OPEN){
      this.sock.send(VMCData);
    } else if (this.sock.readyState >= this.sock.CLOSING){
      // Create new connection is prev one is closed
      this.sock.close();
      this.sock = VMCStreamer.createWebSocket(this.port);
      console.log("Failed to send data, Websocket is Closed", "Retrying connection")
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

  setPort(port: number){
    this.port = port;
    this.sock = VMCStreamer.createWebSocket(port);
  }

  updateBaseNeckRotation(kaliFace:TFace){
    this.baseNeckRotation.x = kaliFace.head.x;
    this.baseNeckRotation.y = kaliFace.head.y;
    this.baseNeckRotation.z = kaliFace.head.z;
    this.updateBase = false;
  }

  release(){
    console.log("closing sock")
    this.sock.close();
    console.log("closing landmarker")
    // this.faceLandmarker?.close();
    console.log("closed VMC streamer")
  }

  static createWebSocket(port: number){
    const ws = new WebSocket("ws://localhost:8765");
    ws.addEventListener("open", () => ws.send(JSON.stringify({type: "init", port: port})));
    return ws;
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