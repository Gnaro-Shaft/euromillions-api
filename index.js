const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

// URL FDJ officielle (à ajuster si nécessaire)
const FDJ_ZIP_URL = "https://example.fdj.fr/euromillions.zip";
const DOWNLOAD_DIR = path.join(__dirname, "data");
const ZIP_PATH = path.join(DOWNLOAD_DIR, "euromillions.zip");
let CSV_FILE_NAME = ""; // Sera déterminé dynamiquement

// Fonction pour télécharger et extraire le fichier
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
    CSV_FILE_NAME = files.find((f) => f.endsWith(".csv"));
    console.log(`[✓] CSV extrait : ${CSV_FILE_NAME}`);
  } catch (err) {
    console.error("[!] Erreur lors du téléchargement ou extraction :", err);
  }
}

// Mise à jour automatique tous les jours à 3h du matin (modifiable)
cron.schedule("0 3 * * *", () => {
  console.log("[⏰] Mise à jour automatique des données FDJ");
  downloadAndExtractCSV();
});

// Lancement initial au démarrage
downloadAndExtractCSV();

// Route publique pour servir le fichier CSV
app.get("/euromillions.csv", (req, res) => {
  if (
    !CSV_FILE_NAME ||
    !fs.existsSync(path.join(DOWNLOAD_DIR, CSV_FILE_NAME))
  ) {
    return res.status(404).send("Fichier CSV non disponible");
  }
  res.sendFile(path.join(DOWNLOAD_DIR, CSV_FILE_NAME));
});

app.listen(PORT, () => {
  console.log(`✅ API Euromillions en ligne sur http://localhost:${PORT}`);
});
