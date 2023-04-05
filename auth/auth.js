const jwt = require('jsonwebtoken');

// Middleware to check if the user is authenticated
module.exports = {

    isAuthenticated: function (req, res, next) {
        if (typeof req.headers.authorization !== "undefined") {
            let token = req.headers.authorization.split(" ")[1];
            let privateKey = process.env.PRIVATE_KEY;
      
            jwt.verify(token, privateKey, { algorithm: process.env.ALGORITHM }, (err, user) => {
                
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