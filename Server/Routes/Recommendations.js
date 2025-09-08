const router = require("express").Router();
const { 
    getSuggestedUsers, getUsersByNameOrEmail, getUsersByNameOrEmailOrSkills, fetchRecommendedGroups,
    fetchRecommendedSessions, fetchRecommendedPosts, getRecommendedPosts, getGroupsByNameOrHashtags
} = require("../Controllers/Recommendations.js");

router.route("/suggested-users").get(getSuggestedUsers);
router.route("/get-recommended-posts").get(getRecommendedPosts);

router.route("/fetch-recommended-posts").get(fetchRecommendedPosts);
router.route("/fetch-recommended-groups").get(fetchRecommendedGroups);
router.route("/fetch-recommended-sessions").get(fetchRecommendedSessions);


router.route("/fetch-users-by-name-or-email/:searchQuery").get(getUsersByNameOrEmail);
router.route("/fetch-groups-by-name-or-hashtags/:searchQuery").post(getGroupsByNameOrHashtags);
router.route("/fetch-users-by-name-or-email-or-skills/:searchQuery").post(getUsersByNameOrEmailOrSkills);

module.exports = router;