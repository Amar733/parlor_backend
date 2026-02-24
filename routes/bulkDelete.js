const express = require("express");
const router = express.Router();
const bulkDeleteController = require("../controllers/bulkDeleteController");

// DELETE /api/bulk-delete/all - Delete all records from multiple collections
router.delete("/all", bulkDeleteController.deleteAllRecords);

module.exports = router;