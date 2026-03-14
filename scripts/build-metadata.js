const fs = require("fs");
const path = require("path");

const metadata = {
  name: "Thrincs Demo Certificate #1",
  description: "Certificado digital verificable tipo NFT para demostración del proyecto Thrincs",
  image: "http://localhost:3000/assets/certificate-demo.png",
  external_url: "http://localhost:3000",
  attributes: [
    { trait_type: "Proyecto", value: "Thrincs" },
    { trait_type: "Tipo", value: "Demo Certificate NFT" },
    { trait_type: "Alumno", value: "Juan Pérez" },
    { trait_type: "Curso", value: "Blockchain Fundamentals" },
    { trait_type: "Institución", value: "Thrincs" },
    { trait_type: "Fecha", value: "2026-03-13" },
    { trait_type: "Estado", value: "Verified" },
    {
      trait_type: "Hash SHA-256",
      value: "608913530dbd799eb3c87afeca32edf3b350149e831728a2778d457432dea7ad"
    }
  ]
};

const outputPath = path.join(__dirname, "../public/metadata/1.json");
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), "utf-8");

console.log(`Metadata generada en: ${outputPath}`);