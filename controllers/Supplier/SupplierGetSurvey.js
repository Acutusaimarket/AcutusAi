const { Survey, Condition, Quotas, Qualification } = require("../../models/association");
const { ResearchSurvey, ResearchSurveyQuota, ResearchSurveyQualification } = require('../../models/uniqueSurvey');

const sequelize = require("../../config");
const { Op } = require("sequelize");

const crypto = require("crypto");
const Supply = require('../../models/supplyModels');

function generateApiUrl(
  survey_id,
  supply_id = "SupplyID",
  AID = "AID",
  Session_id = "sessionID",
  TID = "TokenID"
) {
  const baseUrl = "https://super-duper-broccoli-q7p7qq74v455f44pq-3000.app.github.dev/api/v2/survey/redirect";
  const queryParams = `SupplyID=[%${encodeURIComponent(
    supply_id
  )}%]&PNID=[%${encodeURIComponent(AID)}%]&SessionID=[%${encodeURIComponent(
    Session_id 
  )}%]&TID=[%${encodeURIComponent(TID)}%]`;
  return `${baseUrl}/${survey_id}?${queryParams}`;
}
function generateTestUrl(
  survey_id,
  supply_id = "SupplyID",
  AID = "AID",
  Session_id = "sessionID",
  TID = "TokenID"
) {
  const baseUrl = "https://super-duper-broccoli-q7p7qq74v455f44pq-3001.app.github.dev/api/v2/survey/redirect";
  const queryParams = `supplyID=[%${encodeURIComponent(
    supply_id
  )}%]&PNID=[%${encodeURIComponent(AID)}%]&SessionID=[%${encodeURIComponent(
    Session_id 
  )}%]&TID=[%${encodeURIComponent(TID)}%]`;
  return `${baseUrl}/${survey_id}/test?${queryParams}`;
}


exports.getAllSurveys = async (req, res) => {
  try {
    // Retrieve all surveys from the database
    const surveys = await Survey.findAll();

    // Respond with the list of surveys
    res.status(200).json({
      status: "success",
      data: surveys,
    });
  } catch (err) {
    // Handle any errors that occur during the retrieval process
    console.error("Error fetching surveys:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// exports.getAllSurveysDetail = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log("idea", id);

//     const surveys = await Survey.findAll({
//       where: {
//         id: id,
//       },
//     });

//     if (surveys.length === 0) {
//       return res.status(404).json({
//         status: "not found",

//         message: "No survey found with the given ID",
//       });
//     }

//     res.status(200).json({
//       status: "success",
//       data: surveys[0],
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching the surveys",
//       error: err.message,
//     });
//   }
// };

// Handle request to get all live surveys
const RateCard = require("../../models/SupplierRateCard");

const generateCPI = async (IR, LOI,  apiKey) => {
  try {
    console.log("hhsd",apiKey);
    const sup = await Supply.findOne({
      where : {
        ApiKey : apiKey
      }
    })

    console.log(sup.SupplierID)
    const rateCard = await RateCard.findOne({
      where: {
        IR: LOI,  // IR and LOI should not be mixed here unless intentional
        
        SupplyID: sup.SupplierID,
       
      },
    });

    console.log(rateCard);

    // Return some calculated CPI based on rateCard
    return rateCard ? rateCard.get('IR') : null; 
  } catch (err) {
    console.error("Error in generateCPI:", err);
    return null; // Return null or a default value in case of error
  }
};

const processSurvey = async (survey, apiKey) => {
  const { id, IR, LOI, ...surveyData } = survey.toJSON();

  // Generate Survey CPI using the async function and pass the API key
  const SurveyCPI = await generateCPI(IR, LOI, apiKey);

  return {
    ...surveyData,
    id,
    LiveURL: generateApiUrl(id),
    TestURL: generateApiUrl(id),
    SurveyCPI,  // Append SurveyCPI to the result
  };
};

exports.getLiveSurveys = async (req, res) => {
  const apiKey = req.headers.authorization;  // Get API key from request headers

  if (!apiKey) {
    return res.status(403).json({ message: "No API key provided" });
  }

  try {
    const surveys = await ResearchSurvey.findAll({
      where: {
        is_live: 1,
        message_reason: { [Op.ne]: "deactivated" }
      },
      include: [
        {
          model: ResearchSurveyQuota,
          as: "survey_quotas",
        },
        {
          model: ResearchSurveyQualification,
          as: "survey_qualifications"
        }
      ]
    });
    
    // Perform the CPI calculation for each survey
    const processedSurveys = surveys.map(survey => {
      const surveyData = survey.toJSON(); // Convert to plain object
      surveyData.cpi = surveyData.cpi * 0.8;
      surveyData.livelink = generateApiUrl(surveyData.survey_id);
      surveyData.testlink = generateTestUrl(surveyData.survey_id)

      return surveyData;
    });
    
    
    console.log(processedSurveys);
    

    // Use Promise.all to handle asynchronous processing for all surveys and pass API key
    // const responseData = await Promise.all(surveys.map(survey => processSurvey(survey, apiKey)));

    // console.log("Processed surveys:", responseData.length);

    res.status(200).json({
      status: "success",
      data: processedSurveys,
    });
  } catch (err) {
    console.error("Error in getLiveSurveys:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
    });
  }
};


exports.getFinishedSurveys = async (req, res) => {
  try {
    // Retrieve surveys with status "finished"
    const surveys = await Survey.findAll({
      where: {
        status: "finished",
      },
    });

    res.status(200).json({
      status: "success",
      data: surveys,
    });
  } catch (err) {
    console.error("Error fetching finished surveys:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// exports.getSurveyLink = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const survey = await Survey.findByPk(id);
//     if (!survey) {
//       return res.status(404).json({
//         status: "error",
//         message: "Survey not found",
//       });
//     }
//     const surveyUrl = generateApiUrl(survey.id);
//     res.status(200).json({
//       status: "success",
//       data: {
//         liveUrl: surveyUrl,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching survey link:", err);
//     res.status(500).json({
//       status: "error",
//       message: "Internal server error",
//     });
//   }
// };
