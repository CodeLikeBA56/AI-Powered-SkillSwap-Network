const express = require("express");
const { registerUser, getEverything } = require("../Controllers/Verification.js");

const router = express.Router()

router.post('/', registerUser);
router.get('/', getEverything);

module.exports = router;