import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const dbStatus = mongoose.connection.readyState ? "db connected" : "db disconnected";

    const healthcheck = {
        dbStatus,
        message: "OK",
        uptime: process.uptime(),
        timestamp: Date.now(),
        hrtime: process.hrtime(),
        serverStatus: `Server is running on port ${process.env.PORT}`
    }

    return res
        .status(200)
        .json(new ApiResponse(200, healthcheck, "Health check is successfull"))
    

})

export {
    healthcheck
    }
    