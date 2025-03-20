// ✅ API Node.js mise à jour avec 3 routes de fichiers : EuroMillions, Loto, EuroDreams

const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const unzipper = require("unzipper");
const app = express();
const PORT = process.env.PORT || 10000;

const dataFolder = path.join(__dirname, "data");
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

// URLs officielles à adapter selon les sources FDJ
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
    console.error(`❌ Erreur ${outputFile} :`, err);
  }
}

// Mise à jour automatique au démarrage
(async () => {
  await telechargerEtExtraire(sources.euromillions, "euromillions");
  await telechargerEtExtraire(sources.loto, "loto");
  await telechargerEtExtraire(sources.eurodreams, "eurodreams");
})();

// Routes Express
app.get("/euromillions.csv", (req, res) =>
  res.sendFile(path.join(dataFolder, "euromillions.csv"))
);
app.get("/loto.csv", (req, res) =>
  res.sendFile(path.join(dataFolder, "loto.csv"))
);
app.get("/eurodreams.csv", (req, res) =>
  res.sendFile(path.join(dataFolder, "eurodreams.csv"))
);

app.listen(PORT, () =>
  console.log(`🚀 Serveur actif sur http://localhost:${PORT}`)
);
