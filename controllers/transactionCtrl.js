const User = require("../models/user");
const Transaction = require("../models/transaction");
const controller = {
    getTransactions: async (req, res) => {

        const idUserOriginal = req?.token?.user?._id;
        const userToken = req?.tokenEncoded;
        const rolesUserOriginal = req?.token?.roles;
        const adminRole = rolesUserOriginal.find( (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP");
        let filter={};
        if (!adminRole){
             filter={ userId: idUserOriginal };
        }else if(req?.query?.userId) {
            filter={ userId: req?.query?.userId };
        }
        const dataFromBd = await Transaction.find(filter).exec();
        if (dataFromBd instanceof Error) {
            // console.log("-------------getTransactions ERROR-------------");
            res.status(500).json({ success: false, message: "Une erreur s'est produite!" });
        }
        
         //console.log("getTransactions data : " + JSON.stringify(dataFromBd));
       
         res.json({
            total: dataFromBd?.length,
            data: dataFromBd,           
          });
    },
    createTransaction: async (req, res) => {
        //console.log("createTransaction : " + JSON.stringify(req.body));
        try {
            const userData = await User.findOne({
              _id: req.body.userId,
            }).exec();
        
            if (userData instanceof Error) {
              res.render("error", {
                message: "Une erreur s'est produite",
                error: userData,
              });
              return;
            } else {
              let typeTr = "";
              if (req.body.action.includes(".")) {
                typeTr = req.body.action.split(".")[0];
              } 
        
              dataToSave = new Transaction({
                userId: req.body.userId,
                action: req.body.action,
                type: typeTr,
                currency: req.body.currency,
                amount: req.body.amount,
                createdAt: new Date(),
                updatedAt: null,
                location: req.body.location,
              });
        
              dataToSave.save((err) => {
                if (err) {
                  console.log("erreur save : " + JSON.stringify(err));
                  res.render("error", {
                    message: "Une erreur s'est produite",
                    error: err,
                  });
                  return false;
                }            
              });
              res.json({ success: true, data: dataToSave });
            }
            
        } catch (error) {
            res.render("error", {
                message: "Une erreur s'est produite",
                error: userData,
              });
        }
      },
}
module.exports = controller;