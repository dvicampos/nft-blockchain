const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/metadata", express.static(path.join(__dirname, "public/metadata")));

app.listen(PORT, () => {
  console.log(`Demo corriendo en http://localhost:${PORT}`);
});