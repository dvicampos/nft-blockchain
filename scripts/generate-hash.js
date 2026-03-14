const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const filePath = path.join(__dirname, "../public/assets/certificate-demo.png");

if (!fs.existsSync(filePath)) {
  console.error("No se encontró el archivo certificate-demo.png en public/assets/");
  process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

console.log("\nSHA-256 del certificado:\n");
console.log(hash);
console.log("\nCópialo para usarlo en metadata.\n");