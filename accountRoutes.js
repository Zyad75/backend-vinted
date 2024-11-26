const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const Account = require("../model/Account");

router.post("/user/signup", async (req, res) => {
  console.log(req.body);

  try {
    // afin de créer un nouvel user on veut à partir des paramètres q'il nous transmet génerer un compte utilisateur
    // si l'email  qu'il renseigne est prèsente dans la BDD alors il ne peut paas les utiliser
    const doesMailExist = await Account.findOne({ email: req.body.email });

    if (doesMailExist) {
      return res.json({ message: "Email already used ❗️" });
    }
    // si l'username n'est pas renseigné alors il faut le renseigner obligatoirement
    if (!req.body.username) {
      return res.json({ message: "Warning ! username is required ❗️" });
    }
    //maintenant je vais generer un salt un token et un hash à partir du password recu en body et je vais transmettre ces infos dans l'account en BDD

    const pass = req.body.password;
    //console.log(pass);
    const salt = uid2(16); // je genere un string aleatoire
    const hash = SHA256(pass + salt).toString(encBase64); // ici je concatene le mdp choisi avec un salt (chaine de caractere aleatoire) et Sha256 l'encrypte et je converti le resultat en String
    const token = uid2(16); // le token qui sera attribué lors de la connexion de l'user
    const newAccount = new Account({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newAccount.save();

    res.json({
      message: "Compte crée ✅",
      token: token,
      account: {
        username: req.body.username,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal error server 💢" });
  }
});
router.post("/user/login", async (req, res) => {
  try {
    //console.log(req.body);
    // on cherche à acceder à un compte user (si il existe) à partir du mail transmis en body
    const verifExistingAccount = await Account.findOne({
      email: req.body.email,
    });
    // si on ne trouve pas de mail correspondant a un compte en bdd alors on envoi un msg d'erreur
    if (!verifExistingAccount) {
      return res.json({ message: "Email or password not Found ❗️" });
    }
    // maintenant on va generer un hash a partir du password transmis en body  et du salt de l'user correspondant au mail ,
    const hash = SHA256(req.body.password + verifExistingAccount.salt).toString(
      encBase64
    );
    // on compare ici le hash generer au hash de l'user en BDD si il ne correspondent pas alors ce n'est pas le bon mdp
    if (hash !== verifExistingAccount.hash) {
      return res.json({ message: "Warning ! WRONG EMAIL OR PASSWORD ‼️" });
      // sinon on renvoi la reponse a l'user qui a reussi a se connecter
    } else {
      res.json({
        _id: verifExistingAccount._id,
        token: verifExistingAccount.token,
        account: {
          username: verifExistingAccount.account.username,
        },
        message: "Successfully connected ✅",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal error server ❌" });
  }
});

module.exports = router;