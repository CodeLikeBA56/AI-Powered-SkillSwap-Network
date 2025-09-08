const router = require("express").Router();
const upload = require('../Services/upload.js');
const { 
    createSession, updateSession, deleteSession, getAllSessions, getSessionById, getSessionsByUser, toggleSessionLike, 
    fetchSessionCommentsById, addComment, toggleCommentLike, replyToComment, toggleReplyLike, 
    updateSessionShareByCount, joinSession, makeAttendeeCoHost, removeAttendeeFromCoHost, 
    acceptAttendeeJoinRequest, kickAttendeeFromSession, 
} = require("../Controllers/Session.js");

const {
    onAttendeeMic, offAttendeeMic, onAttendeeCamera, leaveRoom, closeSession, reopenSession,
    offAttendeeCamera, shareAttendeeScreen, closeAttendeeScreen, hostStartsRecording, 
    endSessionRecording, allowHostToPostRecording, endRoom, 
} = require("../Controllers/Live-Session.js");

router.route("/").post(createSession).get(getAllSessions);
router.route('/:sessionId').get(getSessionById).put(updateSession).delete(deleteSession);
    
router.get("/get-user-sessions/:host_id", getSessionsByUser);
router.put("/like-session/:session_id", toggleSessionLike);

router.get("/fetch-session-comments/:sessionId", fetchSessionCommentsById);

router.post("/add-comment-on-session/:sessionId", addComment);
router.put("/:sessionId/like-comment/:commentId", toggleCommentLike);

router.post("/:sessionId/add-reply-to-comment/:commentId", replyToComment);
router.put("/:sessionId/comment/:commentId/like-reply/:replyId", toggleReplyLike);
router.patch("/update-shared-by/:session_id", updateSessionShareByCount);

router.patch("/kick-attendee/:roomId/:sessionId/:attendeeId", kickAttendeeFromSession);
router.patch("/accept-join-request/:sessionId/:attendeeId", acceptAttendeeJoinRequest);

router.patch("/make-attendee-co-host/:sessionId/:attendeeId", makeAttendeeCoHost);
router.patch("/remove-attendee-from-co-host/:sessionId/:attendeeId", removeAttendeeFromCoHost);

router.put("/join-session/:session_id", joinSession);

    // Update Session Status
router.patch('/close-session/:sessionId', closeSession);
router.patch('/reopen-session/:sessionId', reopenSession);

    // Update Session Recording Status
router.patch('/allow-host-to-post-recording', allowHostToPostRecording);
router.patch('/ended-session-recording/:sessionId', endSessionRecording);
router.patch("/update-attendee-recording-status/:roomId/:sessionId", hostStartsRecording);

    // During Live Session Routes
router.patch("/leave-session/:roomId/:sessionId", leaveRoom);
router.patch("/end-live-session/:roomId/:sessionId", endRoom);
router.patch("/on-attendee-mic/:sessionId", onAttendeeMic);
router.patch("/off-attendee-mic/:sessionId", offAttendeeMic);
router.patch("/on-attendee-camera/:sessionId", onAttendeeCamera);
router.patch("/off-attendee-camera/:sessionId", offAttendeeCamera);
router.patch("/share-attendee-screen/:sessionId", shareAttendeeScreen);
router.patch("/turn-off-attendee-screen/:sessionId", closeAttendeeScreen);

module.exports = router;