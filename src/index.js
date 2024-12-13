import * as handTrack from 'handtrackjs';
import './pdf.js'
import './style.css';
import './speech.js'

const video = document.getElementById("srcvideo");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const trackButton = document.getElementById("track");
const pdfContainer = document.getElementById("pdf-container");
const pdfPointer = document.getElementById("pdf-pointer");

let updateNote = document.getElementById("updatenote");
let log = document.getElementById("log");


let isVideo = false;
let model = null;
let lastMidX = -100;
let lastMidY = -100;

let lastActionTime = {
    zoom: 0,
    scroll: 0
};

const COOLDOWN = {
    zoom: 1000,   
    scroll: 800    
};

const modelParams = {
    flipHorizontal: false,
    outputStride: 16,
    imageScaleFactor: 1,
    maxNumBoxes: 20,
    iouThreshold: 0.2,
    scoreThreshold: 0.7,
    modelType: "ssd640fpnlite",
    modelSize: "large",
    bboxLineWidth: "2",
    fontSize: 17,
}

function startVideo() {
    handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            updateNote.innerText = "Video started. Now tracking"
            isVideo = true
            runDetection()
        } else {
            updateNote.innerText = "Please enable video"
        }
    });
}

function toggleVideo() {
    if (!isVideo) {
        updateNote.innerText = "Starting video"
        startVideo();
    } else {
        updateNote.innerText = "Stopping video"
        handTrack.stopVideo(video)
        isVideo = false;
        updateNote.innerText = "Video stopped"
    }
}

trackButton.addEventListener("click", function () {
    toggleVideo();
});


let currentZoom = 1.0;
const zoomFactor = 1.2;
let minZoom = 1.0;
const maxZoom = 5.0;  


function zoomIn() {
    if (currentZoom < maxZoom) {
        currentZoom *= zoomFactor;
        applyZoom();
        logAction('Zoomed In');
    }
}

function zoomOut() {
    if (currentZoom > minZoom) {
        currentZoom /= zoomFactor;
        if (currentZoom < minZoom) currentZoom = minZoom;
        applyZoom();
        logAction('Zoomed Out');
    }
}

function scrollUp() {
    const currentScroll = pdfContainer.scrollTop;
    pdfContainer.scrollTo({
        top: currentScroll + 843,
        behavior: 'smooth'
    });
    logAction('Scrolled Up');
}

function scrollDown() {
    const currentScroll = pdfContainer.scrollTop;
    pdfContainer.scrollTo({
        top: currentScroll - 843,
        behavior: 'smooth'
    });
    logAction('Scrolled Down');
}

function logAction(action) {
    const logEntry = document.createElement('div');
    logEntry.innerText = action;
   
    log.insertBefore(logEntry, log.firstChild);
    

    while (log.children.length > 10) {
        log.removeChild(log.lastChild);
    }
    log.scrollTop = 0;
}

function applyZoom() {
    const canvases = document.getElementsByClassName("pdf-canvas");
    Array.from(canvases).forEach(canvas => {
        if (!minZoom || minZoom === 1.0) {
            const computedStyle = window.getComputedStyle(canvas);
            const initialWidth = parseFloat(computedStyle.width);
            minZoom = initialWidth / 584;
        }

        const originalWidth = 584;
        const originalHeight = 843;
        const newWidth = originalWidth * currentZoom;
        const newHeight = originalHeight * currentZoom;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
    });
}



function runDetection() {
    model.detect(video).then(predictions => {
        model.renderPredictions(predictions, canvas, context, video);
        const pointerPrediction = predictions.find(pred => pred.label === "point");
        if (pointerPrediction) {
            const [, y] = pointerPrediction.bbox;
            const scaledY = scalePointerPosition(y);
            pdfPointer.style.top = `${scaledY}px`;
        } else {
            pdfPointer.style.top = '30px';
        }

        let actionPerformed = false;

        if (predictions.length > 1) {
            const currentTime = Date.now();
            const closedHands = predictions.filter(pred => pred.label === "closed").length;
            const openHands = predictions.filter(pred => pred.label === "open").length;
        
            if (currentTime - lastActionTime.zoom >= COOLDOWN.zoom) {
                if (closedHands === 2) {
                    zoomOut();
                    actionPerformed = true;
                    lastActionTime.zoom = currentTime;
                } else if (closedHands === 1) {
                    zoomIn();
                    actionPerformed = true;
                    lastActionTime.zoom = currentTime;
                }
            }
        
            if (currentTime - lastActionTime.scroll >= COOLDOWN.scroll) {
                if (openHands === 2) {
                    scrollUp();
                    actionPerformed = true;
                    lastActionTime.scroll = currentTime;
                } else if (openHands === 1) {
                    scrollDown();
                    actionPerformed = true;
                    lastActionTime.scroll = currentTime;
                }
            }
        }

        if (actionPerformed) {

            pdfPointer.style.top = '30px';
        }

        if (isVideo) {
            requestAnimationFrame(runDetection);
        }
    });
}

function scalePointerPosition(y) {
    const minInput = 0;
    const maxInput = 340;
    const minOutput = 0;
    const maxOutput = pdfContainer.clientHeight;

    return ((y - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}


handTrack.load(modelParams).then(lmodel => {    
    model = lmodel
    updateNote.innerText = "Loaded Model!"
    trackButton.disabled = false
});






