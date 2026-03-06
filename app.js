const fileInput = document.getElementById("pdfFile");
const processBtn = document.getElementById("processBtn");
const summaryBody = document.getElementById("summaryBody");
const downloadBtn = document.getElementById("downloadBtn");

let sortedPdfBytes = null;

const SIZE_ORDER = [
"XS","S","M","L","XL","XXL",
"3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
];

processBtn.addEventListener("click", processPDF);

async function processPDF(){

const file = fileInput.files[0];
if(!file){
alert("Please upload a PDF");
return;
}

summaryBody.innerHTML = "";
downloadBtn.style.display = "none";

const arrayBuffer = await file.arrayBuffer();

const pdf = await pdfjsLib.getDocument({data:arrayBuffer}).promise;

const pagesBySize = {};

SIZE_ORDER.forEach(size => pagesBySize[size] = []);
pagesBySize["NON-SIZE"] = [];

for(let pageNum=1; pageNum<=pdf.numPages; pageNum++){

const page = await pdf.getPage(pageNum);
const textContent = await page.getTextContent();

let pageText = textContent.items.map(item=>item.str).join(" ");
pageText = pageText.toUpperCase();

let foundSize = detectSize(pageText);

pagesBySize[foundSize].push(pageNum);

}

renderSummary(pagesBySize);

await buildSortedPDF(arrayBuffer,pagesBySize);

downloadBtn.style.display="inline-block";

}

function detectSize(text){

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

let total=0;

for(const size of SIZE_ORDER){

const count = pagesBySize[size].length;

if(count>0){

summaryBody.innerHTML += `
<tr>
<td>${size}</td>
<td>${count}</td>
</tr>
`;

total+=count;

}

}

const nonSizeCount = pagesBySize["NON-SIZE"].length;

if(nonSizeCount>0){

summaryBody.innerHTML += `
<tr>
<td>NON-SIZE</td>
<td>${nonSizeCount}</td>
</tr>
`;

total+=nonSizeCount;

}

summaryBody.innerHTML += `
<tr>
<td><b>Grand Total</b></td>
<td><b>${total}</b></td>
</tr>
`;

}

async function buildSortedPDF(originalBuffer,pagesBySize){

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

downloadBtn.addEventListener("click",()=>{

const blob = new Blob([sortedPdfBytes],{type:"application/pdf"});
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "sorted_labels.pdf";
a.click();

});
