const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctorVisitingController");
const { auth } = require("../middleware/auth");

// router.post("/", auth, controller.createDoctorVisiting);
router.post("/",  controller.createDoctorVisiting);
router.get("/", controller.getDoctorVisiting);
router.get("/doctor/:doctorId", controller.getDoctorVisitingByDoctorId);
router.get("/:id", controller.getDoctorVisitingById);
// router.put("/:id", auth, controller.updateDoctorVisiting);
router.put("/:id",  controller.updateDoctorVisiting);
// router.delete("/:id", auth, controller.deleteDoctorVisiting);
router.delete("/:id", controller.deleteDoctorVisiting);

module.exports = router;
