import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const { page = 1, limit = 10 } = req.query
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Video id is invalid")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    if (!comments) {
        throw new ApiError(402, "Something went wrong while fetching comments")
    }

    return res
        .status(200)
    .json(new ApiResponse(200, comments, "Comments are fetch successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    if (content.trim() === "") {
        throw new ApiError(404, "content is required")
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "video id is invalid")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) {
        throw new ApiError(404, "Something went wrong while commenting")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment done successfully"))
    

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    
    if (content.trim() === "") {
        throw new ApiError(404, "content is required")
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "comment id is invalid")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!comment) {
        throw new ApiError(404, "something went wrong while updating comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment update successfully"))
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "comment id is invalid")
    }


    const deleteComment = await Comment.findByIdAndDelete(
        commentId
    )

    if (!deleteComment) {
        throw new ApiError(404, "Comment does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment is deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }