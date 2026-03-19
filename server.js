
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createCanvas } = require("canvas");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/generated", express.static(path.join(__dirname, "public/generated")));
app.use("/metadata", express.static(path.join(__dirname, "public/metadata")));

const generatedDir = path.join(__dirname, "public/generated");
const metadataDir = path.join(__dirname, "public/metadata");

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

function sanitizeFileName(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function buildCertificateImage({
  studentName,
  courseName,
  institution,
  issueDate,
  folio
}) {
  const width = 1600;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fondo
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b1736");
  gradient.addColorStop(0.5, "#11224f");
  gradient.addColorStop(1, "#0a1022");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Marco
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 70, width - 140, height - 140);

  // Encabezado
  ctx.fillStyle = "#dbeafe";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("THRINCS", width / 2, 150);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 42px Arial";
  ctx.fillText("Certificado Digital Verificable", width / 2, 225);

  ctx.fillStyle = "#93c5fd";
  ctx.font = "28px Arial";
  ctx.fillText("Emitido como demostración blockchain en localhost", width / 2, 275);

  // Cuerpo
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "32px Arial";
  ctx.fillText("Se certifica que", width / 2, 365);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 64px Arial";
  ctx.fillText(studentName, width / 2, 455);

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "32px Arial";
  ctx.fillText("ha completado satisfactoriamente", width / 2, 520);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.fillText(courseName, width / 2, 595);

  // Caja de datos
  const boxX = 160;
  const boxY = 660;
  const boxW = width - 320;
  const boxH = 135;

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 18, true, false);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Institución: ${institution}`, boxX + 30, boxY + 42);
  ctx.fillText(`Fecha de emisión: ${issueDate}`, boxX + 30, boxY + 82);
  ctx.fillText(`Folio: ${folio}`, boxX + 30, boxY + 122);

  ctx.textAlign = "right";
  ctx.fillText("Estado: VERIFIED", boxX + boxW - 30, boxY + 42);
  ctx.fillText("Tipo: Soulbound Certificate Demo", boxX + boxW - 30, boxY + 82);
  ctx.fillText("Red: Hardhat Local / Localhost", boxX + boxW - 30, boxY + 122);

  return canvas;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

app.post("/api/generate-certificate", async (req, res) => {
  try {
    const {
      studentName,
      courseName,
      institution,
      issueDate,
      folio
    } = req.body;

    if (!studentName || !courseName || !institution || !issueDate || !folio) {
      return res.status(400).json({
        error: "Faltan campos requeridos"
      });
    }

    const safeStudent = sanitizeFileName(studentName);
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const imageFileName = `${safeStudent}_${uniqueId}.png`;
    const metadataFileName = `${safeStudent}_${uniqueId}.json`;

    const imagePath = path.join(generatedDir, imageFileName);
    const metadataPath = path.join(metadataDir, metadataFileName);

    const canvas = buildCertificateImage({
      studentName,
      courseName,
      institution,
      issueDate,
      folio
    });

    const imageBuffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imagePath, imageBuffer);

    const documentHash = crypto
      .createHash("sha256")
      .update(imageBuffer)
      .digest("hex");

    const imageUrl = `http://localhost:${PORT}/generated/${imageFileName}`;
    const metadataUrl = `http://localhost:${PORT}/metadata/${metadataFileName}`;

    const metadata = {
      name: `Thrincs Certificate - ${studentName}`,
      description: "Certificado digital verificable generado dinámicamente en localhost para el proyecto Thrincs.",
      image: imageUrl,
      external_url: `http://localhost:${PORT}`,
      attributes: [
        { trait_type: "Alumno", value: studentName },
        { trait_type: "Curso", value: courseName },
        { trait_type: "Institución", value: institution },
        { trait_type: "Fecha de emisión", value: issueDate },
        { trait_type: "Folio", value: folio },
        { trait_type: "Estado", value: "Verified" },
        { trait_type: "Hash SHA-256", value: documentHash }
      ]
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

    return res.json({
      success: true,
      imageUrl,
      metadataUrl,
      documentHash,
      imageFileName,
      metadataFileName,
      metadata
    });
  } catch (error) {
    console.error("Error generando certificado:", error);
    return res.status(500).json({
      error: "No se pudo generar el certificado"
    });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});