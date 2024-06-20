import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes, total tweets etc.
    if (!req.user?._id) {
        throw new ApiError(404, "Unathorized access")
    }

    const stats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "owner",
                foreignField: "owner",
                as: "tweets"
            }
        },
        {
            $group: {
                _id: null,
                totalVideo: { $sum: 1 },
                totalVideoViews: { $sum: "$views" },
                totalSubscribers: { $first: { $size: "$subscribers" } },
                totalLikes: { $first: { $size: "$likes" } },
                totalTweets: { $first: { $size: "$tweets" }}
            }
        },
        {
            $project: {
                _id: 0,
                totalVideo: 1,
                totalVideoViews: 1,
                totalSubscribers: 1,
                totalLikes: 1,
                totalTweets: 1            
            }
        }
    ])
    if (!stats) { 
        throw new ApiError(404, "Something went wrong while fetching stats")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, stats[0], "Channel stats is fetch successfully"))
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    if (!req.user?._id) {
        throw new ApiError(404, "Unathorized access")
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$likes"
                }
            }
        }
    ])

    if (!videos) {
        throw new ApiError(404, "Something went wrong while fetching videos")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "All videos of channel is fetch successfully"))
    
})

export {
    getChannelStats, 
    getChannelVideos
    }