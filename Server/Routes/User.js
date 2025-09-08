const express = require('express');
const upload = require('../Services/upload.js');
const { updateProfile, updatePersonalInformation, updateUserCertificates, updateProfilePicture, 
    updateUserSocialLinks, getUserById, followUser, unfollowUser, handleUpdateUserPreferences,
    bookmarkPost, removePostFromBookmark, bookmarkSession, removeSessionFromBookmark, updateTimeSpent,
    handleUpdateOfferedSkills, handleUpdateDesiredSkills, fetchUserById
} = require('../Controllers/User.js');

const router = express.Router();

router.get('/get-user-detail', getUserById);
router.get('/fetch-user-info/:userId', fetchUserById);
router.put('/set-user-skills', upload.single('profilePicture'), updateProfile);
router.put('/update-profile-picture/:newProfileId', updateProfilePicture);

router.patch('/follow-user/:user_id_to_follow', followUser);
router.patch('/unfollow-user/:user_id_to_unfollow', unfollowUser);
router.patch('/update-personal-information', updatePersonalInformation);
router.patch('/update-user-certificates', upload.array('certificates', 10), updateUserCertificates);
router.patch('/update-social-links', updateUserSocialLinks);

router.put('/update-offered-skills', handleUpdateOfferedSkills);
router.put('/update-desired-skills', handleUpdateDesiredSkills);
router.put('/bookmark-post/:postId', bookmarkPost);
router.put('/bookmark-session/:sessionId', bookmarkSession);

router.patch('/update-time-spent', updateTimeSpent);
router.patch('/update-setting-preferences', handleUpdateUserPreferences);

router.delete('/remove-bookmarked-post/:postId', removePostFromBookmark);
router.delete('/remove-bookmarked-session/:sessionId', removeSessionFromBookmark);

module.exports = router;