var express = require('express');
var router = express.Router();

const transactionCtrl = require("../controllers/transactionCtrl");
const token_auth = require("../middleWare/token_auth");
/* GET */
router.get('/', token_auth, transactionCtrl.getTransactions);

router.post('/', transactionCtrl.createTransaction);


module.exports = router;