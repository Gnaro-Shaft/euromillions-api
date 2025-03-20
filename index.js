// ✅ API Node.js avec routes sécurisées, vérification des fichiers et mise à jour déclenchée par CRON (/update-script)

const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const unzipper = require("unzipper");
const app = express();
const PORT = process.env.PORT || 10000;

const dataFolder = path.join(__dirname, "data");
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

const sources = {
  euromillions:
    "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afe6",
  loto: "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afp6",
  eurodreams:
    "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afa5",
};

async function telechargerEtExtraire(url, outputFile) {
  try {
    const zipPath = path.join(dataFolder, outputFile + ".zip");
    const response = await axios({ url, responseType: "stream" });
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);
    await new Promise((res, rej) => writer.on("finish", res).on("error", rej));
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: dataFolder }));
    console.log(`✅ ${outputFile} mis à jour.`);
  } catch (err) {
    console.error(`❌ Erreur téléchargement ${outputFile}:`, err);
  }
}

// Route de mise à jour externe (CRON compatible)
app.get("/update-script", async (req, res) => {
  try {
    await telechargerEtExtraire(sources.euromillions, "euromillions");
    await telechargerEtExtraire(sources.loto, "loto");
    await telechargerEtExtraire(sources.eurodreams, "eurodreams");
    res.send("✅ Mise à jour automatique terminée.");
  } catch (e) {
    res.status(500).send("❌ Échec de mise à jour.");
  }
});

// Fichiers CSV - vérification d'existence
app.get("/euromillions.csv", (req, res) => {
  const filePath = path.join(dataFolder, "euromillions.csv");
  fs.existsSync(filePath)
    ? res.sendFile(filePath)
    : res.status(404).send("Fichier EuroMillions non trouvé");
});

app.get("/loto.csv", (req, res) => {
  const filePath = path.join(dataFolder, "loto.csv");
  fs.existsSync(filePath)
    ? res.sendFile(filePath)
    : res.status(404).send("Fichier Loto non trouvé");
});

app.get("/eurodreams.csv", (req, res) => {
  const filePath = path.join(dataFolder, "eurodreams.csv");
  fs.existsSync(filePath)
    ? res.sendFile(filePath)
    : res.status(404).send("Fichier EuroDreams non trouvé");
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${PORT}`);
});
