var express = require('express');
var router = express.Router();
const userCtrl = require("../controllers/userCtrl");

/* GET users listing. */
router.get('/', userCtrl.allUsers);


router.get('/user/create', userCtrl.getUserCreateFrm);


router.post('/user/create',userCtrl.createUser);

router.get('/user/view', userCtrl.getUserToUpdate);
router.get('/user/update',userCtrl.getUserToUpdate);

router.post('/user/update',userCtrl.updateUser);
router.get("/user/delete",userCtrl.deleteUser)
router.post('/user/create-transaction', userCtrl.createTransaction);
router.get('/user/delete-transaction', userCtrl.deleteTransaction);
router.post('/user/update-transaction', userCtrl.updateTransaction);
router.get('/user/goto-rewards', userCtrl.gotoRewards);
module.exports = router;
