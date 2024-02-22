import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { Face, TFace, Vector } from "kalidokit";
import Quaternion from "quaternion";
import osc from "osc-min";
import { DataConnection } from "peerjs";
import EventEmitter from "events";

export class WStrasmitLink {
  port: number;
  ws: WebSocket;

  constructor(port: number){
    this.port = port;
    this.ws =  WStrasmitLink.createWebSocket(port);
  }

  send(buffer: Buffer){
    if(this.ws.readyState == this.ws.OPEN){
      this.ws.send(buffer);
    } else if (this.ws.readyState >= this.ws.CLOSING){
      // Create new connection is prev one is closed
      this.ws.close();
      this.ws = WStrasmitLink.createWebSocket(this.port);
      console.log("Failed to send data, Websocket is Closed", "Retrying connection");
    }
  }

  setPort(port: number){
    this.port = port;
    this.ws.close();
    this.ws = WStrasmitLink.createWebSocket(port);
  }

  close(){
    this.ws.close();
  }

  static createWebSocket(port: number){
    const ws = new WebSocket("ws://localhost:8765");
    ws.addEventListener("open", () => ws.send(JSON.stringify({type: "init", port: port})));
    return ws;
  }
}

export class WRTCclientLink{
  dc: DataConnection;

  constructor(dc: DataConnection){
    this.dc = dc;
  }

  send(buf: Buffer){
    if (this.dc.open){
      this.dc.send({type:"motionData", data: buf})
    }
  }

  close(){
  }
}

export class VMCStreamer  extends EventEmitter{
  video: HTMLVideoElement;
  stream: MediaStream;
  framerate: number;
  faceLandmarker: FaceLandmarker | undefined; 
  baseNeckRotation: Vector;
  upperArmRotation: Vector;
  updateBase: boolean;
  ticker: Worker

  constructor(video: HTMLVideoElement, stream: MediaStream) {
    super();
    this.video = video;
    this.stream = stream;
    this.framerate = stream.getVideoTracks()[0].getSettings().frameRate ?? 30;
    this.baseNeckRotation = new Vector(0, 0, 0);
    this.upperArmRotation = new Vector(0, 0, 0);
    this.updateBase = false;
    // this.video.srcObject = this.stream;
    this.ticker = new Worker(new URL("MediapipeSloverWorker.ts", import.meta.url))

    VMCStreamer.createFaceLandmarker().then((faceLandmarker) => this.faceLandmarker = faceLandmarker)
    this.ticker.addEventListener("message", (msg) => {
      this.detection();
    })
    this.video.onplay = () => {
      this.ticker.postMessage({type:"control", play: true});
      this.emit("start");
    };
    const vidTracks = this.stream.getVideoTracks();
    if (vidTracks.length > 0){
      const vidTrack = vidTracks[0];
      vidTrack.addEventListener("mute", () => this.ticker.postMessage({type:"control", play: false}));
      vidTrack.addEventListener("unmute", () => this.ticker.postMessage({type:"control", play: true}));
    }
  }

  async detection() {
    const timeNow = performance.now()
    this.ticker.postMessage({type:"time", time:timeNow})
    // Now let's start detecting the stream.
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
            this.emit("data", vmcMsgs);
          }
          // console.log(prevTime, "results: ", kaliFace)
        } 
      }


    // If the stream is not active or video is paused
    // pause the ticker
    if (!this.stream.active || this.video.paused) {
      this.ticker.postMessage({type:"control", play: false});
      this.emit("stop");
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

  release(){
    console.log("closing sock")
    this.ticker.terminate();
    console.log("closing landmarker")
    // this.faceLandmarker?.close();
    console.log("closed VMC streamer")
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