const jwt = require('jsonwebtoken');

module.exports = {

    isAuthenticated: function (req, res, next) {
        if (typeof req.headers.authorization !== "undefined") {
            let token = req.headers.authorization.split(" ")[1];
            let privateKey = "MySuperSecretPassPhrase";
      
            jwt.verify(token, privateKey, { algorithm: "HS256" }, (err, user) => {
                
                if (err) {  
                    res.status(500).json({ error: "Not Authorized" });
                }
                else {
                  return next();
                }
            });
        } else {
            res.status(500).json({ error: "Not Authorized" });
        }
    }
};