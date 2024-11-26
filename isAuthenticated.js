const Account = require("../model/Account");
const isAuthenticated = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization.replace("Bearer ", "");
    const checkingToken = await Account.findOne({ token: bearerToken });
    //console.log(checkingToken);
    // console.log(req.headers.authorization.replace("Bearer ", ""));
    // si il n y a aucun token correspondant à un compte utilisateur alors le client ne sera pas autorisé à poster une offre
    if (!checkingToken) {
      return res.status(400).json({ message: "Unauthorized !!!!!!!!!!" });
    }
    req.user = checkingToken;
    next();
  } catch (error) {
    //
  }
};
module.exports = isAuthenticated;
