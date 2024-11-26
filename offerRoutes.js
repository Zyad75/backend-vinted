const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "di0b0ptxh",
  api_key: "131843217332521",
  api_secret: "lzTssqd8FB82qPjKqJoy23q4MD4",
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
const isAuthenticated = require("../middleware/isAuthenticated");
const Account = require("../model/Account");
const Offer = require("../model/Offer");
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.body);
      // console.log(req.files);

      // ici on cherche à verifier si le token transmis en bearer token correspond a un token d'un compte utilisateur
      //   const bearerToken = req.headers.authorization.replace("Bearer ", "");
      //   const checkingToken = await Account.findOne({ token: bearerToken });
      //   console.log(checkingToken);
      //   console.log(req.headers.authorization.replace("Bearer ", ""));
      //   // si il n y a aucun token correspondant à un compte utilisateur alors le client ne sera pas autorisé à poster une offre
      //   if (!checkingToken) {
      //     return res.status(400).json({ message: "Unauthorized !!!!!!!!!!" });
      //   }

      // ici on reçoit bien les paramètre body en form data grace au file upload, cependant la picture nécessite un traitement pour la sauvegarder sur cloudinary et obtenir un url que l'on stockera en DB et que l'on renverra au client en reponse et
      // afin de sauvegarder l'image sur cloudi je vais d'avord la convertir en base 64

      const pictureConvert = convertToBase64(req.files.picture);
      //console.log(pictureConvert);
      // ensuite pour generer l'url
      const resultPic = await cloudinary.uploader.upload(pictureConvert);
      //console.log(resultPic);

      // si le token correspond alors le client peut poster une offre, et celle ci sera lié en DB à son compte user
      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          req.body.brand,
          req.body.size,
          req.body.condition,
          req.body.color,
          req.body.city,
        ],
        product_image: resultPic.secure_url,
        owner: req.user._id,
      });
      // on sauvegarde la nouvelle offre de l'user en DB
      await newOffer.save();
      // reponse au client avec les infos sur l'offre postée
      res.status(201).json({
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: [
          {
            MARQUE: newOffer.product_details[0],
          },
          {
            TAILLE: newOffer.product_details[1],
          },
          {
            ÉTAT: newOffer.product_details[2],
          },
          {
            COULEUR: newOffer.product_details[3],
          },
          {
            EMPLACEMENT: newOffer.product_details[4],
          },
        ],
        owner: {
          account: req.user.account,
          _id: req.user._id,
        },
        product_image: {
          // ...
          // informations sur l'image du produit
          secure_url: newOffer.product_image,
          // ...
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page } = req.query;
    // ici l'objet filters me permet de verifier et d'ajouter les filtre dans mon find et sort successivement tout en verifiant les conditions (si les parametres query sont présents ou pas)
    const filters = {};
    const sortObj = {};
    let numberPerPage = 0;
    let nextPage = 0;
    const titleFilter = new RegExp(title, "i");
    if (title) {
      filters.product_name = titleFilter;
    }

    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      // si j'ai aussi pricemin alors je rajoute une clé à ça  { $gte: priceMin }
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }

    if (sort) {
      sortObj.product_price = sort;
    }
    if (page) {
      nextPage = 0;
      numberPerPage = 5;
      for (i = 2; i <= page; i++) {
        numberPerPage = numberPerPage;
        nextPage = nextPage + 5;
      }
    }
    let offers = await Offer.find(filters)
      .sort(sortObj)
      .skip(nextPage)
      .limit(numberPerPage)
      .select("product_name product_price -_id");
    let totalResult = offers.length;
    //pour chaque parametre si il ya un des parametres query (filtre) alors on affiche seulement les resultats (nb d'offres) liés à ce filtre la
    // if (title) {
    //   offers = await Offer.find({
    //     product_name: titleFilter,
    //   }).select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }
    // if (priceMax) {
    //   offers = await Offer.find({ product_name: titleFilter })
    //     .find({
    //       product_price: { $lte: priceMax },
    //     })
    //     .select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }
    // if (priceMin) {
    //   offers = await Offer.find({ product_name: titleFilter })
    //     .find({
    //       product_price: { $gte: priceMin },
    //     })
    //     .select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }
    // if (priceMin && priceMax) {
    //   offers = await Offer.find({ product_name: titleFilter })
    //     .find({
    //       product_price: { $gte: priceMin },
    //     })
    //     .find({
    //       product_price: { $lte: priceMax },
    //     })
    //     .select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }
    // if (sort) {
    //   offers = await Offer.find()
    //     .sort({ product_price: sort })
    //     .select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }

    // if (priceMin || priceMax || title || page) {
    //   offers = await Offer.find({
    //     product_name: titleFilter,
    //     product_price: { $gte: priceMin, $lte: priceMax },
    //   })
    //   .select("product_name product_price -_id");
    //   totalResult = offers.length;
    // }
    res.json({ total: totalResult, result: offers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "-email -_id -newsletter -token -salt -hash"
    );

    res.json(offer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
