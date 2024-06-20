import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideobyId,
    publishVideo,
    togglePublishStatus,
    updateThumbnail,
    updateVideo
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";



const router = Router();

router.use(verifyJWT)

router.route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishVideo);

router.route("/:videoId")
    .get(getVideobyId)
    .delete(deleteVideo)
    .patch(updateVideo)

router.route("/update-thumbnail/:videoId").patch(
    upload.single("thumbnail"),
    updateThumbnail
)
router.route("/toggle-publish/:videoId").patch(togglePublishStatus)

export default router