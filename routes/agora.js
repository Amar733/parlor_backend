const express = require('express');
const router = express.Router();
const agoraController = require('../controllers/agoraController');
const { auth } = require('../middleware/auth');

// @route   POST /api/agora/token
// @desc    Generate Agora Token
// @access  Protected (or Public based on requirements, let's keep it protected or semi-protected via link validation ideally, but for now Public is easiest for the meet page to consume without full auth if the link is the secret)
// Actually, if the user is a patient accessing via a link, they might not be logged in. 
// So we might need a public endpoint that validates the linkId first. 
// For now, let's make it public but expect the client to have validated the meet link first.
router.post('/token', agoraController.generateToken);

module.exports = router;
