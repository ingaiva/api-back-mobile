const fetch = require("node-fetch");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Transaction = require("../models/transaction");
const controller = {
  allUsers: async (req, res) => {
    const UsersFromBd = await User.find().exec();
    if (UsersFromBd instanceof Error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: UsersFromBd,
      });
    }

    res.render("index", {
      title: "DashBoard JoinUs",
      data: UsersFromBd,
    });
  },
  getUserCreateFrm: async (req, res) => {
    try {
      res.render("user", {
        title: "Création de l'utilisateur",
        action: "/user/create",
        id: undefined,
        email: "",
        password: "",
        username: "",
        birthday: "",
        gender: "f",
        locale: "fr_FR",
        isActive: true,
        isVerified: false,
        roles: ["ROLE_USER"],
        msgErreur: "",
        transactions: [],
        addTransactions: false,
        link: "",
      });
    } catch (error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: error,
      });
    }
  },
  createUser: async (req, res) => {
    try {
      if (writeToDb(req, res)) {
        //redirection vers la page d'accueil du site:
        res.redirect(301, "/");
      } else {
        manageError(req, res, "/user/create", "Erreur");
      }
    } catch (error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: error,
      });
    }
  },
  updateUser: async (req, res) => {
    try {
      if (writeToDb(req, res, req.body.id)) {
        res.redirect(301, "/");
      } else {
        manageError(req, res, "/user/update", "Erreur");
      }
    } catch (error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: error,
      });
    }
  },

  getUserToUpdate: async (req, res) => {
    //console.log("req: " +  req.method + " - " + req.baseUrl + " - " + req.path);

    const userData = await User.findOne({
      _id: req.query.id,
    }).exec();
    if (userData instanceof Error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: userData,
      });
      return;
    } else {
      let addTransactions = false;
      if (req.path === "/user/view") addTransactions = true;
      const transactionData = await Transaction.find({
        userId: req.query.id,
      }).exec();
      res.render("user", {
        title: "Modification de l'utilisateur",
        action: "/user/update",
        id: userData._id,
        email: userData.email,
        password: userData.password,
        username: userData.username,
        birthday: userData.birthday,
        gender: userData.gender,
        locale: userData.locale,
        isActive: userData.isActive,
        isVerified: userData.isVerified,
        roles: userData.roles,
        msgErreur: "",
        transactions: transactionData,
        addTransactions: addTransactions,
        link: "",
      });
    }
  },
  deleteUser: async (req, res) => {
    const userData = await User.findOne({
      _id: req.query.id,
    }).exec();
    if (userData instanceof Error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: userData,
      });
      return;
    } else {
      const result = await User.deleteOne({ _id: req.query.id });
      const resultTransactions = await Transaction.deleteMany({
        userId: req.query.id,
      });
      res.redirect(301, "/");
    }
  },
  deleteTransaction: async (req, res) => {
    try {
      let userId = undefined;
      const transactionData = await Transaction.findOne({
        _id: req.query.id,
      }).exec();
      if (transactionData instanceof Transaction) {
        userId = transactionData.userId;
      }
      const result = await Transaction.deleteOne({ _id: req.query.id });
      if (userId) {
        res.redirect(301, "/user/view?id=" + userId);
      } else {
        res.redirect(301, "/");
      }
    } catch (error) {
      res.render("error", {
        message: "Une erreur s'est produite",
        error: error,
      });
    }
  },
  createTransaction: async (req, res) => {
    console.log("createTransaction : " + JSON.stringify(req.body));
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

      let location = {};
      if (
        req.body.coordinates &&
        Array.isArray(req.body.coordinates) &&
        req.body.coordinates.length >= 2 &&
        req.body.coordinates[0].length > 0 &&
        req.body.coordinates[1].length > 0
      ) {
        location.type = "Point";
        location.coordinates = req.body.coordinates;
        await getAdress(
          req.body.coordinates[1],
          req.body.coordinates[0],
          location
        );
      }

      dataToSave = new Transaction({
        userId: req.body.userId,
        action: req.body.action,
        type: typeTr,
        currency: req.body.currency,
        amount: req.body.amount,
        createdAt: new Date(),
        updatedAt: null,
        location: location,
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
        res.redirect(301, "/user/view?id=" + req.body.userId);
      });
    }
  },
  updateTransaction: async (req, res, next) => {
    const transactionData = await Transaction.findOne({
      _id: req.body.id,
    }).exec();

    try {
      if (transactionData instanceof Transaction) {
        transactionData[req.body.name] = req.body.value;
        transactionData.updatedAt = new Date();
        transactionData.save((err) => {
          if (err) {
            console.log("erreur save : " + JSON.stringify(err));
            res.status(500).send("updateTransaction error ");
          }

          res.sendStatus(200);
        });
      }
    } catch (error) {
      console.log("updateTransaction err : " + JSON.stringify(error));
      res
        .status(500)
        .send("updateTransaction error : " + JSON.stringify(error));
    }
  },
  gotoRewards: async (req, res, next) => {
    const userData = await User.findOne({ _id: req.query.id,}).exec();

    if (userData instanceof Error) {
      res.render("error", { message: "Une erreur s'est produite", error: userData,});
      return;

    } else {
        const pwd=userData.password;
        userData.password=undefined;
      const dataToken = {
        _id: userData._id,
        roles: userData.roles,
        access: "auth",
        hasParameters: true,
        user: userData,
      };
      let exp = "10h";
      const adminRole = userData.roles.find(
        (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
      );
      if (adminRole) exp = "365d";
      let token = jwt.sign(  dataToken, process.env.api_secret, {  expiresIn: exp,} );

      const options = { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json"}};

      let url = process.env.HOST_REWARDS_API + "/user/login";

      const responsePromise = await fetch(url, options);
      const data = await responsePromise.json();

      console.log("gotoRewards response fetch : " + JSON.stringify(data));

      if (data && data?.success) {        
       
        const transactionData = await Transaction.find({ userId: userData._id }).exec();

        res.render("user", {
          title: "Modification de l'utilisateur",
          action: "/user/update",
          id: userData._id,
          email: userData.email,
          password: pwd,
          username: userData.username,
          birthday: userData.birthday,
          gender: userData.gender,
          locale: userData.locale,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          roles: userData.roles,
          msgErreur: "",
          transactions: transactionData,
          addTransactions: true,
          link: data?.link,
        });
      } else {
        res.render("error", {
          message: "Une erreur s'est produite :  " + JSON.stringify(data),
        });
      }
    }
  },
};


/*************** Utilitaires************** */
async function getAdress(lon, lat,location){
    let url =`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`;
    var myInit = { method: "GET" };
    const responsePromise = await fetch(url, myInit);
    const data = await responsePromise.json();
    try {       
        if (data.hasOwnProperty("features") &&  data.features.length > 0 &&  data.features[0].hasOwnProperty("properties") &&  data.features[0].properties.hasOwnProperty("label") ) {
            location.info=data.features[0].properties.label
        }
    } catch (error) {
        console.log("err fetch " + JSON.stringify(error));    
    }      
}

async function manageError(req, res, action, msgErreur) {
    //msgErreur
    res.render("user", {
        action: action,
        title: "Modification de l'utilisateur",
        id: req.body.id,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        birthday: req.body.birthday,
        gender: req.body.gender,
        locale: req.body.locale,
        isActive: req.body.isActive,
        isVerified: req.body.isVerified,
        roles: req.body.roles,
        msgErreur: msgErreur,
        transactions:[],
        addTransactions:false,
        link:""
    });
}
async function writeToDb(req, res, _id) {
    
    try {
        //console.log("writeToDb user : " + JSON.stringify(req.body));
        let pwd=bcrypt.hashSync(req.body.password, 10);
        let userToSave = null;
        if (_id) {
            userToSave = await User.findOne({
                _id: _id,
            }).exec();

            userToSave.email = req.body.email;
            if(req.body.updatePassword){
                //console.log(" maj pwd : "+ bcrypt.compareSync(req.body.password, userToSave.password))
                userToSave.password = pwd;
            }            
            userToSave.username = req.body.username;
            userToSave.birthday = req.body.birthday;
            userToSave.gender = req.body.gender;
            userToSave.locale = req.body.locale;
            userToSave.isActive = req.body.isActive;
            userToSave.isVerified = req.body.isVerified;
            userToSave.roles = req.body.roles;

        } else {
            console.log("creation de user")
            userToSave = new User({
                email: req.body.email,
                password: pwd,
                username: req.body.username,
                birthday: req.body.birthday,
                gender: req.body.gender,
                locale: req.body.locale,
                isActive: req.body?.isActive? true : false,
                isVerified: req.body?.isVerified? true : false,
                roles: req.body.roles,
            });
            console.log(JSON.stringify(userToSave));
        }

        userToSave.save((err) => {
            if (err) {                
                 console.log("erreur save : " + JSON.stringify(err))
                return false;
            }
            return true;
        });
    } catch (error) {
        console.log(error);
    }
    return false;
}
module.exports = controller;
