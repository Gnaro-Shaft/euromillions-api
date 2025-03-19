// Mini API Node.js Express pour exposer le fichier CSV FDJ dézippé

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

const FDJ_ZIP_URL =
  "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afe6"; // à modifier avec l'URL réelle
const DOWNLOAD_DIR = path.join(__dirname, "data");
const ZIP_PATH = path.join(DOWNLOAD_DIR, "euromillions.zip");
const FINAL_CSV_NAME = "euromillions.csv";
let CSV_FILE_NAME = FINAL_CSV_NAME;

async function downloadAndExtractCSV() {
  try {
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

    const response = await axios({
      method: "GET",
      url: FDJ_ZIP_URL,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(ZIP_PATH);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await fs
      .createReadStream(ZIP_PATH)
      .pipe(unzipper.Extract({ path: DOWNLOAD_DIR }))
      .promise();

    const files = fs.readdirSync(DOWNLOAD_DIR);
    const fichierCSV = files.find((f) => f.endsWith(".csv"));

    if (fichierCSV && fichierCSV !== FINAL_CSV_NAME) {
      const extractedPath = path.join(DOWNLOAD_DIR, fichierCSV);
      const targetPath = path.join(DOWNLOAD_DIR, FINAL_CSV_NAME);
      fs.renameSync(extractedPath, targetPath);
      CSV_FILE_NAME = FINAL_CSV_NAME;
    }

    console.log(`[✓] Fichier CSV prêt : ${CSV_FILE_NAME}`);
  } catch (err) {
    console.error("[!] Erreur lors du téléchargement/extraction :", err);
  }
}

cron.schedule("0 3 * * *", () => {
  console.log("[⏰] Mise à jour automatique des données FDJ");
  downloadAndExtractCSV();
});

downloadAndExtractCSV();

app.get("/euromillions.csv", (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, CSV_FILE_NAME);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Fichier CSV non disponible");
  }
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`✅ API Euromillions en ligne sur http://localhost:${PORT}`);
});
