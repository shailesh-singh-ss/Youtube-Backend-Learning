import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const like = await Like.findOne({ likedBy: req.user?._id, video: videoId }).select("_id")

    if (!like) {
        const likedVideo = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if (!likedVideo) {
            throw new ApiError(401, "Something went while liking the video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, likedVideo, "Video is liked successfully"))
        
    }

    const deleteLike = await Like.findByIdAndDelete(like._id)

    if (!deleteLike) {
        throw new ApiError(401, "Something went while unliking the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video is unliked successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "comment Id is invalid")
    }

    const like =await Like.find({ likedBy: req.user?._id, comment: commentId }).select("_id")
    
    if (!like.length) {
        const likedCommet = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        if (!likedCommet) {
            throw new ApiError(401, "Something went while liking the comment")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, likedCommet, "Comment is liked successfully"))
        
    }

    const deleteLike = await Like.findByIdAndDelete(like)

    if (!deleteLike) {
        throw new ApiError(401, "Something went while unliking the comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment is unliked successfully"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const like =await Like.find({ likedBy: req.user?._id, tweet: tweetId }).select("_id")
    
    if (!like.length) {
        const likedTweet = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if (!likedTweet) {
            throw new ApiError(401, "Something went while liking the tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, likedTweet, "Tweet is liked successfully"))
        
    }

    const deleteLike = await Like.findByIdAndDelete(like)

    if (!deleteLike) {
        throw new ApiError(401, "Something went while unliking the tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet is unliked successfully"))

})

const getLikedVideos = asyncHandler(async (req, res) => { 
    //TODO: get all liked videos

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar:1
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
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $replaceRoot: {
                newRoot: "$likedVideo",
            },
        },
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideo, "liked video fetch succeffuly"))
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}