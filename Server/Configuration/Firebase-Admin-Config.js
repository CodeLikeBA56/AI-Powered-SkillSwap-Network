var admin = require("firebase-admin");

var serviceAccount = require("../skillswap-d4e37-firebase-adminsdk-fbsvc-020d9c194c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;