import './style.css';
const pdfContainer = document.getElementById("pdf-container");
const uploadInput = document.getElementById("upload-pdf");
const pdfPointer = document.getElementById("pdf-pointer");

pdfPointer.style.position = "absolute";
pdfPointer.style.width = "100%";
pdfPointer.style.height = "10px";
pdfPointer.style.backgroundColor = "rgba(255, 0, 0, 0.5)";

function updatePointerPosition(predictions) {
    for (const prediction of predictions) {
        if (prediction.label === "point") {
            const yValue = prediction.bbox[1];
            
            const pdfContainerHeight = pdfContainer.offsetHeight;
            const scaledPosition = (yValue / 340) * pdfContainerHeight;
            
            pdfPointer.style.top = `${scaledPosition}px`;
        }
    }
}

    uploadInput.addEventListener("change", async function (event) {
      const file = event.target.files[0]; 
      if (file && file.type === "application/pdf") {
        const fileReader = new FileReader();

        fileReader.onload = async function () {
          const typedArray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          pdfContainer.innerHTML = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            canvas.className = "pdf-canvas"
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            pdfContainer.appendChild(canvas);
            await page.render({ canvasContext: context, viewport }).promise;
          }
        };

        fileReader.readAsArrayBuffer(file); 
      } else {
        alert("Please select a valid PDF file.");
      }
    });


 


