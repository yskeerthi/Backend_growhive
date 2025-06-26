const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectioncontrol');
const user = require("../controllers/usercontroller");
router.get('/user',user.getAllUsers);
router.post('/request', connectionController.sendRequest);
router.post('/try',user.try);
router.delete('/withdraw/:requestId',connectionController.withdraw);
router.get('/count/:userId',connectionController.getConnectionCount)

//Not Used 
router.put('/accept/:id', connectionController.acceptRequest);
router.put('/status/:id', connectionController.updateStatus);
router.get('/connections/:userId', connectionController.getConnections);
router.get('/received/:userId', connectionController.getReceivedRequests);
router.get('/sent/:userId', connectionController.getSentRequests);


module.exports = router;
