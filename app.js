const fileInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusDiv = document.getElementById("status");
const summaryBody = document.querySelector("#summaryTable tbody");

let sortedPdfBytes;

const sizeOrder = [
"S","M","L","XL","XXL",
"3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
];

function getSizeIndex(size){
return sizeOrder.indexOf(size);
}

function extractSize(text){

const match = text.match(/\b(\d?XL|XXXL|XXL|XL|L|M|S)\b/i);

if(match){

let size = match[1].toUpperCase();

if(size === "XXXL") size = "3XL";

return size;

}

return null;

}

processBtn.addEventListener("click", async () => {

const file = fileInput.files[0];

if(!file){
alert("Upload PDF first");
return;
}

statusDiv.innerText = "Reading PDF...";

const arrayBuffer = await file.arrayBuffer();

/* FIX HERE */
const loadingTask = pdfjsLib.getDocument({data:arrayBuffer});
const pdf = await loadingTask.promise;

let pages = [];
let sizeCount = {};

for(let i=1;i<=pdf.numPages;i++){

statusDiv.innerText = "Reading page " + i;

const page = await pdf.getPage(i);
const textContent = await page.getTextContent();

const text = textContent.items.map(t => t.str).join(" ");

const size = extractSize(text);

pages.push({
pageNumber:i,
size:size
});

if(size){
sizeCount[size] = (sizeCount[size] || 0) + 1;
}

}

statusDiv.innerText = "Sorting pages...";

pages.sort((a,b)=>{
return getSizeIndex(a.size) - getSizeIndex(b.size);
});

const { PDFDocument } = PDFLib;

const newPdf = await PDFDocument.create();
const existingPdf = await PDFDocument.load(arrayBuffer);

for(let p of pages){

const [copied] = await newPdf.copyPages(existingPdf,[p.pageNumber-1]);
newPdf.addPage(copied);

}

sortedPdfBytes = await newPdf.save();

renderSummary(sizeCount);

downloadBtn.disabled = false;

statusDiv.innerText = "Processing complete";

});

function renderSummary(counts){

summaryBody.innerHTML = "";

sizeOrder.forEach(size => {

if(counts[size]){

let row = document.createElement("tr");

row.innerHTML = `<td>${size}</td><td>${counts[size]}</td>`;
summaryBody.appendChild(row);

}

});

}

downloadBtn.addEventListener("click",()=>{

const blob = new Blob([sortedPdfBytes],{type:"application/pdf"});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;
a.download = "sorted_labels.pdf";

a.click();

});
