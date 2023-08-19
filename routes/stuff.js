const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const { imageResizer } = require("../middleware/sharp");

const stuffCtrl = require("../controllers/stuff");

router.get("/", stuffCtrl.getAllStuff);
router.get("/bestrating", stuffCtrl.bestBooks);
router.get("/:id", stuffCtrl.getOneThing);
router.post("/", auth, multer, imageResizer, stuffCtrl.createThing);
router.put("/:id", auth, multer, imageResizer, stuffCtrl.modifyThing);
router.delete("/:id", auth, stuffCtrl.deleteThing);
router.post("/:id/rating", auth, stuffCtrl.rateBook);

module.exports = router;
