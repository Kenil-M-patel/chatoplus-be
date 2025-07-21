const router = require('express').Router();
const auth = require('./auth/authRoutes');
const message = require('./message/messageRoute');

router.use('/auth', auth);
router.use('/messages', message);

module.exports = router;