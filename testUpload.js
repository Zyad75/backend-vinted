const express = require("express");
// On importe `express-fileupload` et on choisit de nommer l'import `fileUpload`
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const app = express();
cloudinary.config({
  cloud_name: "di0b0ptxh",
  api_key: "131843217332521",
  api_secret: "lzTssqd8FB82qPjKqJoy23q4MD4",
});
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
// On positionne le middleware `fileUpload` dans la route `/upload`
app.post("/upload", fileUpload(), async (req, res) => {
  // on récupère les fichiers reçus et on les affiche avec un `console.log`
  console.log(req.body);
  console.log(req.files);
  //res.send("OK");
  try {
    const pictureToUpload = req.files.picture;
    // On envoie une à Cloudinary un buffer converti en base64
    const result = await cloudinary.uploader.upload(
      convertToBase64(pictureToUpload)
    );
    console.log(result);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
