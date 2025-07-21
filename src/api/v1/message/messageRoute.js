const router = require('express').Router();
const { getMessagesBetweenUsers, sendMessage } = require('./messageController');
const authMiddleware = require('../../../middlewares/auth');

router.get('/messages', authMiddleware, getMessagesBetweenUsers);
router.post('/sendMessage',authMiddleware, sendMessage);


module.exports = router;