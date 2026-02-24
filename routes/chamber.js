const express = require("express");
const router = express.Router();
const chamberController = require("../controllers/chamberController");
const {auth } = require("../middleware/auth"); // your JWT middleware

// router.post("/", auth, chamberController.createChamber);
router.post("/",  chamberController.createChamber);
router.get("/", chamberController.getChambers);
router.get("/doctor/:doctorId", chamberController.getChamberByDoctorId);
router.get("/:id", chamberController.getChamberById);
// router.put("/:id", auth, chamberController.updateChamber);
router.put("/:id",  chamberController.updateChamber);

// router.delete("/:id", auth, chamberController.deleteChamber);
router.delete("/:id",  chamberController.deleteChamber);

module.exports = router;

