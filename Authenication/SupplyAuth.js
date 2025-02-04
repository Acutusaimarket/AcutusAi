const express = require("express");
const router = express.Router();
const { ResearchSurvey, ResearchSurveyQuota, ResearchSurveyQualification } = require('../models/uniqueSurvey');
const surveyDetail = require("../controllers/Supplier/SupplierData");
const surveyGetController = require("../controllers/Supplier/SupplierGetSurvey");
const surveyDetailController = require("../controllers/Supplier/SupplierDetail");
const surveyPriceController = require("../controllers/Supplier/SupplierPriceCard");

const Supply = require("../models/supplyModels"); 
// console.log("hi")
const SupplyAuthChecker = async (req, res, next) => {
    console.log(req.headers);
    const ApiKey = req.headers["authorization"];
    console.log(Supply);
    console.log("detail") ;
    try {
        const SupplyData = await Supply.findOne({ where: { ApiKey } }); // Fixed variable name
        if (SupplyData) {
            next();
        } else {
            res.status(401).json({ message: "Unauthenticated" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", err });
    }
};

const surveyCacheChecker = async(req,res) => {
    const {id} = req.params 

}


router.get(
    "/price",
    surveyPriceController.createRateCard
);
// console.log("hi")

router.post("/prescreen/update/:AID", surveyDetailController.convertSurvey)
router.get("/:id", surveyDetailController.fetchSurvey);
router.get(
    "/detail/:id",
    SupplyAuthChecker,
    surveyDetailController.getAllSurveysDetail
);
// console.log("hi")

router.get("/detaillive/:id", surveyDetailController.getDetail);


// console.log("hi")

// router.get("/live", SupplyAuthChecker, surveyGetController.);
router.get("/", SupplyAuthChecker, surveyGetController.getLiveSurveys);
router.get(
    "/finished",
    SupplyAuthChecker,
    surveyGetController.getFinishedSurveys
);
// console.log("h")



router.post("/cookies/:id", surveyDetailController.CookiesDetail)
router.get("/redirect/:sid",  surveyDetailController.redirectToSurvey);
// console.log("hds")

router.get("/redirect/:sid/test",  surveyDetailController.redirectToSurvey);
router.get(
    "/link/:id",
    SupplyAuthChecker,
    surveyDetailController.getSurveyLink
);
router.get(
    "/quota/:id",
    SupplyAuthChecker,
    surveyDetailController.getSurveyQuota
);


router.post("/service", SupplyAuthChecker, surveyDetailController.buyerData);
router.get(
    "/qualification/:id",
    SupplyAuthChecker,
    surveyDetailController.getSurveyQualification
);

router.get("/reporting/:id", surveyDetailController.detail)
router.get("/complete/:id", surveyDetailController.Complete )

module.exports = router;
