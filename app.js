const fileInput = document.getElementById("pdfUpload");
const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const statusDiv = document.getElementById("status");
const summaryBody = document.querySelector("#summaryTable tbody");

let sortedPdfBytes;
let pages = [];

const sizeOrder = [
"XS","S","M","L","XL",
"XXL","3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
];

/* ===============================
SIZE NORMALIZATION
=============================== */

function normalizeSize(size){

if(!size) return "NON-SIZE";

size = size.toUpperCase().trim();

if(size === "2XL") size = "XXL";
if(size === "XXXL") size = "3XL";

if(sizeOrder.includes(size)) return size;

return "NON-SIZE";

}

/* ===============================
MEESHO SIZE EXTRACTOR
(Original stable logic)
=============================== */

function extractMeeshoSize(items){

let sizeHeader = null;

for(let item of items){

if(item.str.trim().toUpperCase() === "SIZE"){
sizeHeader = item;
break;
}

}

if(!sizeHeader) return "NON-SIZE";

const headerX = sizeHeader.transform[4];
const headerY = sizeHeader.transform[5];

let bestCandidate = null;
let bestDistance = Infinity;

for(let item of items){

const text = item.str.trim();
if(!text) continue;

const x = item.transform[4];
const y = item.transform[5];

const dx = Math.abs(x - headerX);
const dy = headerY - y;

if(dx < 15 && dy > 5 && dy < 60){

if(dy < bestDistance){
bestDistance = dy;
bestCandidate = text;
}

}

}

return normalizeSize(bestCandidate);

}

/* ===============================
FLIPKART SIZE EXTRACTOR
=============================== */

function extractFlipkartSize(items){

for(let item of items){

const line = item.str.trim();

if(line.includes("|")){

const parts = line.split("|");

if(parts.length > 0){

const sku = parts[0].trim();

const match = sku.match(/-(XS|S|M|L|XL|XXL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|10XL)$/i);

if
