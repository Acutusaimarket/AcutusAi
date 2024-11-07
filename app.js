const express = require("express");
const cors = require("cors");
const app = express();
const {
    Survey,
    Condition,
    Quotas,
    Qualification,
  } = require("./models/association");
const bodyParser = require('body-parser');
const surveyDetailController = require("./controllers/Supplier/SupplierDetail");
const Auth = require("./Authenication/BuyerCreate");
const SupplyAuth = require("./Authenication/SupplierCreate");
const surveyRoutes = require("./Authenication/BuyerAuth");
const detailRoutes = require("./Authenication/SupplyAuth");
const Hook = require("./controllers/Buyer/webHook")

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.post('/call', Hook.createSurvey)
app.get("/:status", surveyDetailController.buyerData)
app.post("/supply/create", SupplyAuth.SupplierCreate);
app.post("/api/create", Auth.BuyerCreate);
app.use("/api/v1/survey", surveyRoutes);
app.use("/api/v2/survey", detailRoutes);

module.exports = app;
