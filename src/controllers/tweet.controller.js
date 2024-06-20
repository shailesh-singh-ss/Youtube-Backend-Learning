import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (content.trim() === "") {
        throw new ApiError(401, "content is required")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user?._id,
        }
    )

    if (!tweet) {
        throw new ApiError(404, "something went wrong while tweeting")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet is created successfully"))
    

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    
    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "user id is invalid")
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])
    
    if (!tweets) {
        throw new ApiError(404, "something went wrogn while fetching tweets")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "All tweets are fetch successfully"))
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "tweet id is invalid")
    }

    if (content.trim() === "") {
        throw new ApiError(404, "Content is required")
    }

    const oldTweet = await Tweet.findById(tweetId)

    if (oldTweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "unathorized access")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!tweet) {
        throw new ApiError(404, "something went wrong while updating tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet is updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "tweet id is invalid")
    }
    
    const oldTweet = await Tweet.findById(tweetId)

    if (oldTweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "unathorized access")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deleteTweet) {
        throw new ApiError(404, "something went wrong while deleting tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet is deleted successfully"))

})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}