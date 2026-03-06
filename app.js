const fileInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusDiv = document.getElementById("status");
const summaryBody = document.querySelector("#summaryTable tbody");

let sortedPdfBytes;

const sizeOrder = [
"XS","S","M","L","XL",
"XXL","3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
];

function normalizeSize(size){

if(!size) return "NON-SIZE";

size = size.toUpperCase().trim();

if(size === "2XL") size = "XXL";
if(size === "XXXL") size = "3XL";

if(sizeOrder.includes(size)) return size;

return "NON-SIZE";

}

function extractSize(text){

const match = text.match(/\b(\d{1,2}XL|XXXL|XXL|XL|L|M|S|XS)\b/i);

if(match){
return normalizeSize(match[1]);
}

return "NON-SIZE";

}

processBtn.addEventListener("click", async () => {

const file = fileInput.files[0];

if(!file){
alert("Upload PDF first");
return;
}

statusDiv.innerText = "Reading PDF...";

const arrayBuffer = await file.arrayBuffer();

/* IMPORTANT FIX */
const pdfBuffer = arrayBuffer.slice(0);

const loadingTask = pdfjsLib.getDocument({data: pdfBuffer});
const pdf = await loadingTask.promise;

let pages = [];
let sizeCount = {};

for(let i=1;i<=pdf.numPages;i++){

statusDiv.innerText = "Reading page " + i + " / " + pdf.numPages;

const page = await pdf.getPage(i);
const textContent = await page.getTextContent();

const text = textContent.items.map(t => t.str).join(" ");

let size = extractSize(text);

pages.push({
pageNumber:i,
size:size
});

sizeCount[size] = (sizeCount[size] || 0) + 1;

}

pages.sort((a,b)=>{

if(a.size === "NON-SIZE" && b.size !== "NON-SIZE") return -1;
if(a.size !== "NON-SIZE" && b.size === "NON-SIZE") return 1;

if(a.size === "NON-SIZE" && b.size === "NON-SIZE") return 0;

return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);

});

statusDiv.innerText = "Building sorted PDF...";

const { PDFDocument } = PDFLib;

/* LOAD ORIGINAL BUFFER AGAIN */
const existingPdf = await PDFDocument.load(arrayBuffer);
const newPdf = await PDFDocument.create();

for(let p of pages){

const [copied] = await newPdf.copyPages(existingPdf,[p.pageNumber-1]);
newPdf.addPage(copied);

}

sortedPdfBytes = await newPdf.save();

renderSummary(sizeCount);

downloadBtn.disabled = false;

statusDiv.innerText = "Sorting complete";

});

function renderSummary(counts){

summaryBody.innerHTML = "";

let total = 0;

if(counts["NON-SIZE"]){

let row = document.createElement("tr");
row.innerHTML = `<td>NON-SIZE</td><td>${counts["NON-SIZE"]}</td>`;
summaryBody.appendChild(row);

total += counts["NON-SIZE"];

}

sizeOrder.forEach(size => {

if(counts[size]){

let row = document.createElement("tr");
row.innerHTML = `<td>${size}</td><td>${counts[size]}</td>`;
summaryBody.appendChild(row);

total += counts[size];

}

});

let totalRow = document.createElement("tr");

totalRow.innerHTML = `
<td style="font-weight:bold">Grand Total</td>
<td style="font-weight:bold">${total}</td>
`;

summaryBody.appendChild(totalRow);

}

downloadBtn.addEventListener("click",()=>{

const blob = new Blob([sortedPdfBytes],{type:"application/pdf"});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;
a.download = "sorted_labels.pdf";

a.click();

});
