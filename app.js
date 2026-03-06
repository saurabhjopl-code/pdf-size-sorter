const fileInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const summaryBody = document.querySelector("#summaryTable tbody");
const downloadBtn = document.getElementById("downloadBtn");
const statusDiv = document.getElementById("status");

let sortedPdfBytes = null;

const SIZE_ORDER = [
"XS","S","M","L","XL","XXL",
"3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
];

processBtn.addEventListener("click", processPDF);

async function processPDF(){

const file = fileInput.files[0];

if(!file){
alert("Please upload a PDF first.");
return;
}

statusDiv.innerText = "Reading PDF...";
summaryBody.innerHTML = "";
downloadBtn.disabled = true;

const originalBuffer = await file.arrayBuffer();

/* clone buffer to avoid detached ArrayBuffer error */
const pdfBuffer = originalBuffer.slice(0);

const pdf = await pdfjsLib.getDocument({data:pdfBuffer}).promise;

const pagesBySize = {};

SIZE_ORDER.forEach(size => pagesBySize[size] = []);
pagesBySize["NON-SIZE"] = [];

for(let pageNum = 1; pageNum <= pdf.numPages; pageNum++){

statusDiv.innerText = "Scanning page " + pageNum + " of " + pdf.numPages;

const page = await pdf.getPage(pageNum);
const textContent = await page.getTextContent();

let pageText = textContent.items.map(i => i.str).join(" ").toUpperCase();

const size = detectSize(pageText);

pagesBySize[size].push(pageNum);

}

renderSummary(pagesBySize);

statusDiv.innerText = "Building sorted PDF...";

await buildSortedPDF(originalBuffer, pagesBySize);

statusDiv.innerText = "Sorting complete";

downloadBtn.disabled = false;

}

function detectSize(text){

if(text.includes(" XXXL ")) return "3XL";
if(text.includes(" 2XL ")) return "XXL";

for(const size of SIZE_ORDER){

if(
text.includes(" "+size+" ") ||
text.includes("-"+size) ||
text.includes(size+"\n") ||
text.endsWith(size)
){
return size;
}

}

return "NON-SIZE";

}

function renderSummary(pagesBySize){

let total = 0;

for(const size of SIZE_ORDER){

const count = pagesBySize[size].length;

if(count > 0){

const row = document.createElement("tr");

row.innerHTML = `
<td>${size}</td>
<td>${count}</td>
`;

summaryBody.appendChild(row);

total += count;

}

}

const nonSizeCount = pagesBySize["NON-SIZE"].length;

if(nonSizeCount > 0){

const row = document.createElement("tr");

row.innerHTML = `
<td>NON-SIZE</td>
<td>${nonSizeCount}</td>
`;

summaryBody.appendChild(row);

total += nonSizeCount;

}

const totalRow = document.createElement("tr");

totalRow.innerHTML = `
<td><b>Grand Total</b></td>
<td><b>${total}</b></td>
`;

summaryBody.appendChild(totalRow);

}

async function buildSortedPDF(originalBuffer, pagesBySize){

const pdfDoc = await PDFLib.PDFDocument.create();
const sourcePdf = await PDFLib.PDFDocument.load(originalBuffer);

for(const size of SIZE_ORDER){

for(const pageNum of pagesBySize[size]){

const [copiedPage] = await pdfDoc.copyPages(sourcePdf,[pageNum-1]);
pdfDoc.addPage(copiedPage);

}

}

for(const pageNum of pagesBySize["NON-SIZE"]){

const [copiedPage] = await pdfDoc.copyPages(sourcePdf,[pageNum-1]);
pdfDoc.addPage(copiedPage);

}

sortedPdfBytes = await pdfDoc.save();

}

downloadBtn.addEventListener("click", ()=>{

const blob = new Blob([sortedPdfBytes], {type:"application/pdf"});
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "sorted_labels.pdf";
a.click();

});
