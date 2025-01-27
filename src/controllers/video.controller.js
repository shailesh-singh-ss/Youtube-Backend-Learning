import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    let filter = {}

    if (query) {
        filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        ]
    }

    if (userId) {
        filter.owner = userId
    }

    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortType === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)

    const count = await Video.countDocuments(filter)

    return res
        .status(200)
        .json(new ApiResponse(200,
            {
                videos,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalCount: count,
            },
            "All videos fetch successfully"
        ))
})



const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title.trim() || !description.trim()) {
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const duration = videoFile.duration;

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner: req.user?._id
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while publishing the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video published successfully"))
    
})


const getVideobyId = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId?.trim())) {
        throw new ApiError(400, "VideoId is missing")
    }

    const findvideo = await Video.findById(videoId);

    if (!findvideo) {
        throw new ApiError(404, "Video does not exist")
    }

    const user = await User.findById(req.user?._id).select("watchHistory")

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isViewed = user.watchHistory.includes(videoId);

    if (!isViewed) {
        await Video.findByIdAndUpdate(videoId, 
            {
                $inc: {
                    views: 1
                }
            },
            {
                new: true
            }
        )
    }

    await User.findByIdAndUpdate(req.user?._id, 
        {
            $addToSet: {
                watchHistory: videoId
            }
        },
        { new: true }
    )

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetch successfully"))
    
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description,
    if (!isValidObjectId(videoId?.trim())) {
        throw new ApiError(400, "VideoId is missing")
    }

    const preVideo = await Video.findById(videoId, { owner: 1 })

    if (preVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(300, "Unauthorized Access")
    }

    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }


    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description
            }
        },
        {
            new: true
        }
    )


    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details are updated"))
    
})


const updateThumbnail = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId?.trim())) {
        throw new ApiError(400, "VideoId is missing")
    }
    
    const preVideo = await Video.findById(videoId, { thumbnail: 1, owner: 1 })

    if (preVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(300, "Unauthorized Access")
    }

    const thumbnailLocalPath = req.file?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail file")
    }

    const previousThumbnail = preVideo.thumbnail;

    const deleteThumbnail = await deleteFromCloudinary(previousThumbnail)

    if (!deleteThumbnail)  {
        throw new ApiError(400, "Error while deleting thumbnail file")
    }


    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Thumbnail updated successfully"))
    
    
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId?.trim())) {
        throw new ApiError(400, "VideoId is missing")
    }

    
    const preVideo = await Video.findById(videoId, { thumbnail: 1, videoFile: 1, owner: 1 })

    if (preVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(300, "Unauthorized Access")
    }


    const previousThumbnail = preVideo.thumbnail;
    const previousVideo = preVideo.videoFile
    
    const deleteVideoFile = await deleteFromCloudinary(previousVideo)
    
    if (!deleteVideoFile) {
        throw new ApiError(404, "Error while deleting video file")
    }
    
    const deleteThumbnail = await deleteFromCloudinary(previousThumbnail)
    
    if (!deleteThumbnail)  {
        throw new ApiError(400, "Error while deleting thumbnail file")
    }
    
    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found")
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))

})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId?.trim())) {
        throw new ApiError(400, "VideoId is missing")
    }

    const preVideo = await Video.findById(videoId, { isPublished: 1, owner: 1 })

    if (preVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(300, "Unauthorized Access")
    }


    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !preVideo.isPublished
            }
        },
        {
            new: true
        }
    )

    if (!video) {
        throw new ApiError(404, "Video does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Toggle publish status successfully"))
    
})


export {
    getAllVideos,
    publishVideo,
    getVideobyId,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus
}