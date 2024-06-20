import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"





const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "channel Id is invalid")
    }

    const subscribed = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id }).select("_id")
    
    if (!subscribed) {
        const subscriber = await Subscription.create(
            {
                subscriber: req.user?._id,
                channel: channelId
            }
        )

        if (!subscriber) {
            throw new ApiError(404, "something went wrong while subscribering")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscriber, "Channel subscribed successfully"))
    }

    const unsubscribe = await Subscription.findByIdAndDelete(subscribed._id)

    if (!unsubscribe) {
        throw new ApiError(401, "something went wrong while unsubscribing")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel unsubscribed successfully"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "channel id is invalid")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
    ])

    if (!subscriber.length) {
        throw new ApiError(401, "something went wrong while fetching subscribers")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscriber, "all subscriber are fetch successfully"))
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId)
    if (!isValidObjectId(subscriberId?.trim())) {
        throw new ApiError(401, "subscriber id is invalid")
    }

    const channel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        }
    ])

    if (!channel) {
        throw new ApiError(401, "something went wrong while fetching channels")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel, "all channels are fetch successfully"))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}