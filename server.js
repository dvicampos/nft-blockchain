const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createCanvas } = require("canvas");

const app = express();
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/generated", express.static(path.join(__dirname, "public/generated")));
app.use("/metadata", express.static(path.join(__dirname, "public/metadata")));

const generatedDir = path.join(__dirname, "public/generated");
const metadataDir = path.join(__dirname, "public/metadata");

ensureDir(generatedDir);
ensureDir(metadataDir);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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

function createUniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function buildDocumentHash(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
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

function drawHeader(ctx, width) {
  ctx.fillStyle = "#dbeafe";
  ctx.textAlign = "center";
  ctx.font = "bold 60px Arial";
  ctx.fillText("THRINCS", width / 2, 150);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 42px Arial";
  ctx.fillText("Certificado Digital Verificable", width / 2, 225);

  ctx.fillStyle = "#93c5fd";
  ctx.font = "28px Arial";
  ctx.fillText("Generado dinámicamente en localhost", width / 2, 275);
}

function drawBody(ctx, width, studentName, courseName) {
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
}

function drawFooterBox(ctx, width, institution, issueDate, folio) {
  const boxX = 160;
  const boxY = 660;
  const boxW = width - 320;
  const boxH = 135;

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 18, true, false);

  ctx.fillStyle = "#cbd5e1";
  ctx.textAlign = "left";
  ctx.font = "24px Arial";
  ctx.fillText(`Institución: ${institution}`, boxX + 30, boxY + 42);
  ctx.fillText(`Fecha de emisión: ${issueDate}`, boxX + 30, boxY + 82);
  ctx.fillText(`Folio: ${folio}`, boxX + 30, boxY + 122);

  ctx.textAlign = "right";
  ctx.fillText("Estado: VERIFIED", boxX + boxW - 30, boxY + 42);
  ctx.fillText("Tipo: Soulbound Certificate Demo", boxX + boxW - 30, boxY + 82);
  ctx.fillText("Red: Hardhat Local / Localhost", boxX + boxW - 30, boxY + 122);
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

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b1736");
  gradient.addColorStop(0.5, "#11224f");
  gradient.addColorStop(1, "#0a1022");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 70, width - 140, height - 140);

  drawHeader(ctx, width);
  drawBody(ctx, width, studentName, courseName);
  drawFooterBox(ctx, width, institution, issueDate, folio);

  return canvas;
}

function validatePayload(body) {
  const studentName = String(body.studentName || "").trim();
  const courseName = String(body.courseName || "").trim();
  const institution = String(body.institution || "").trim();
  const issueDate = String(body.issueDate || "").trim();
  const folio = String(body.folio || "").trim();

  if (!studentName || !courseName || !institution || !issueDate || !folio) {
    return {
      ok: false,
      error: "Faltan campos requeridos"
    };
  }

  if (studentName.length > 100 || courseName.length > 120 || institution.length > 120 || folio.length > 80) {
    return {
      ok: false,
      error: "Uno o más campos exceden el tamaño permitido"
    };
  }

  return {
    ok: true,
    value: {
      studentName,
      courseName,
      institution,
      issueDate,
      folio
    }
  };
}

app.post("/api/generate-certificate", (req, res) => {
  try {
    const validation = validatePayload(req.body);

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const {
      studentName,
      courseName,
      institution,
      issueDate,
      folio
    } = validation.value;

    const safeStudent = sanitizeFileName(studentName);
    const uniqueId = createUniqueId();

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

    // Hash único por emisión para evitar choques en el contrato
    const documentHash = buildDocumentHash({
      studentName,
      courseName,
      institution,
      issueDate,
      folio,
      imageFileName,
      metadataFileName,
      generatedAt: new Date().toISOString(),
      randomSeed: uniqueId
    });

    const imageUrl = `${BASE_URL}/generated/${imageFileName}`;
    const metadataUrl = `${BASE_URL}/metadata/${metadataFileName}`;

    const metadata = {
      name: `Thrincs Certificate - ${studentName}`,
      description:
        "Certificado digital verificable generado dinámicamente en localhost para el proyecto Thrincs.",
      image: imageUrl,
      external_url: `${BASE_URL}/verify.html`,
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

    console.log("[CERTIFICATE GENERATED]");
    console.log(`Alumno: ${studentName}`);
    console.log(`Curso: ${courseName}`);
    console.log(`Folio: ${folio}`);
    console.log(`Imagen: ${imageUrl}`);
    console.log(`Metadata: ${metadataUrl}`);
    console.log(`Hash: ${documentHash}`);

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
    console.error("[GENERATE CERTIFICATE ERROR]", error);

    return res.status(500).json({
      success: false,
      error: "No se pudo generar el certificado",
      details: error.message
    });
  }
});

app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    message: "Servidor funcionando correctamente",
    baseUrl: BASE_URL
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${BASE_URL}`);
});