const { query } = require("express-validator");
const { ROUTING_CONTRACTS } = require("../utils/constants");

const swapOneChainSchema = [
    query("tokenIn")
        .notEmpty().withMessage("tokenIn is required"),
    query("tokenOut")
        .notEmpty().withMessage("tokenIn is required")
        .custom((value, {req}) => {
            if(value == req.query.tokenIn) {
                throw new Error(`tokenOut can not equal to tokenIn`);
            }
            return true;
        }),
    query("amount")
        .notEmpty().withMessage("amount is required")
        .matches(/\d/).withMessage('amount must contain a number')
        .isLength({ min: 9 }).withMessage("amount required at least 9 digit"),
    query("chainId")
        .notEmpty().withMessage("chainId is required")
        .matches(/\d/).withMessage('chainId must contain a number')
        .custom((value) => {
            if(!ROUTING_CONTRACTS.hasOwnProperty(value)) {
                throw new Error(`chainId ${value} does not exist`);
            }
            return true;
        })
]

const swapCrossChainSchema = [
    query("tokenIn")
        .notEmpty().withMessage("tokenIn is required"),
    query("tokenOut")
        .notEmpty().withMessage("tokenIn is required")
        .custom((value, {req}) => {
            if(value == req.query.tokenIn) {
                throw new Error(`tokenOut can not equal to tokenIn`);
            }
            return true;
        }),
    query("amount")
        .notEmpty().withMessage("amount is required")
        .matches(/\d/).withMessage('amount must contain a number')
        .isLength({ min: 9 }).withMessage("amount required at least 9 digit"),
    query("sourceChainId")
        .notEmpty().withMessage("sourceChainId is required")
        .matches(/\d/).withMessage('sourceChainId must contain a number')
        .custom((value) => {
            if(!ROUTING_CONTRACTS.hasOwnProperty(value)) {
                throw new Error(`sourceChainId ${value} does not exist`);
            }
            return true;
        }),
    query("destinationChainId")
        .notEmpty().withMessage("destinationChainId is required")
        .matches(/\d/).withMessage('destinationChainId must contain a number')
        .custom((value, {req}) => {
            if(!ROUTING_CONTRACTS.hasOwnProperty(value)) {
                throw new Error(`destinationChainId ${value} does not exist`);
            }
            if(value == req.query.sourceChainId) {
                throw new Error(`destinationChainId can not equal to sourceChainId`);
            }
            return true;
        })
]

module.exports = {
    swapOneChainSchema,
    swapCrossChainSchema
}