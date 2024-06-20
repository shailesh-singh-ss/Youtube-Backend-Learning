import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application, json } from "express"
import { updateUserAvatar } from "./user.controller.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const { name, description } = req.body
    
    if (name.trim() === "" || description.trim() === "") {
        throw new ApiError(404, "All fields are required")
    }

    const playlist = await Playlist.create(
        {
            name,
            description,
            owner: req.user?._id
        }
    )

    if (!playlist) {
        throw new ApiError(404, "Something went wrong while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist is created successfully"))
    

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "user id is invalid")
    }

    const playlists = await Playlist.find({owner: userId})

    if (!playlists) {
        throw new ApiError(404, "Something went wrong while fetching playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "All playlists are fetch successfully"))
    

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is invalid")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "playlistVideo",
                pipeline:[

                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avater: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: {
                                $first: "$videoOwner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!playlist) {
        throw new ApiError(404, "Playlist does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist is fecth successfully"))
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is invalid")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video id is invalid")
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!addVideo) {
        throw new ApiError(404, "something went wrong while adding a video to playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, addVideo, "Video is successfully added to playlist"))
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is invalid")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video id is invalid")
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video: videoId
            }
        },
        {
            new: true
        }
    )

    if (!removeVideo) {
        throw new ApiError(404, "something went wrong while removing a video from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, removeVideo, "Video is removed successfully"))
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is invalid")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(404, "Something went wrong while deleting playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist is deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "playlist id is invalid")
    }

    if (name.trim() === "" || description.trim() === "") {
        throw new ApiError(404, "All fields are required")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updatePlaylist) {
        throw new ApiError(404, "Something went wrong while updating playlist")
    }

    return res
        .status(200)
        , json(new ApiResponse(200, updatePlaylist, "Playlist details are updated successfully"))
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}