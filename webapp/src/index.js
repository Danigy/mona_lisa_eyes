import "./style.css";
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

tfjsWasm.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@latest/dist/tfjs-backend-wasm.wasm');


let model, ctx, videoWidth, videoHeight, video, canvas;

const state = {
  backend: 'wasm'
};

async function setupCamera() {
  video = document.getElementById('cam');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': { facingMode: 'user' },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}


const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

const oldImage = document.querySelector("#deepFakeImage");
let eye;

function moveEyes(leftEye, rightEye) {
    if (leftEye && rightEye) {
      eye = (leftEye + rightEye) / 2;
    } else if (leftEye < 0) {
      eye = rightEye;
    } else if (rightEye > video.width) {
      eye = leftEye
    }
    let headPos = Math.floor(map(eye, 0, video.width, 0, 64));
    headPos = Math.min(Math.max(headPos, 0), 64);
    if (!isNaN(headPos)) {
        const newImage = document.createElement("IMG");
        const ID = document.createElement("id");
        oldImage.src =  './assets/frames/frame_' + headPos + '.png';
    }
}

const renderPrediction = async () => {
  const returnTensors = false;
  const flipHorizontal = true;
  const annotateBoxes = true;
  const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    const midEye = (landmarks[0][0] + landmarks[1][0]) / 2;
    moveEyes(landmarks[0][0], landmarks[1][0]);
  }

  setTimeout(function () {
    requestAnimationFrame(renderPrediction)
  }, 40);
};

const setupPage = async () => {
  resizeItems();
  await tf.setBackend(state.backend);
  await setupCamera();
  video.play();

  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;
  video.style.cssText = "-moz-transform: scale(-1, 1); \
    -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); \
    transform: scale(-1, 1); filter: FlipH;";

  model = await blazeface.load();
  renderPrediction();
};

const heightRatio = 0.33603092783;
const headTopRatio = 0.11082474226;
const marginLeftRatio = 0.0197368421;

const resizeItems = async() => {
  const mlWithFrame = document.querySelector("#monaLisaWithFrame");
  mlWithFrame.style.height = window.innerHeight + "px";

  const deepFakeImage = document.querySelector("#deepFakeImage");
  const deepFakeContainer = document.querySelector("#deepFake");
  deepFakeImage.style.height = window.innerHeight *  heightRatio + "px";
  deepFakeContainer.style.marginTop = window.innerHeight * headTopRatio + "px";
  // Calculate the margin left with respect to the width of the picture
  deepFakeContainer.style.marginLeft = monaLisaWithFrame.width * marginLeftRatio + "px";
}

window.addEventListener('resize', resizeItems)

setupPage();
