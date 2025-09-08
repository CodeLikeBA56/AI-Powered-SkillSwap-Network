import './Achievement.css';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from '../../components/Custom/Modal.jsx';
import ShowAchievementByCategory from './ShowAchievementByCategory.jsx';
import { useAchievements } from '../../context/AchievementsProvider.jsx';

const getProgress = (userProgress, type) => {
    switch (type) {
        case "like-post":
            return userProgress?.noOfPostsLiked || 0;
        case "share-post":
            return userProgress?.noOfPostsShared || 0;
        case "comment-post":
            return userProgress?.noOfPostsCommented || 0;
        case "make-post":
            return userProgress?.noOfPosts || 0;
        case "make-session":
            return userProgress?.noOfSessions || 0;
        case "like-session":
            return userProgress?.noOfSessionsLiked || 0;
        case "share-session":
            return userProgress?.noOfSessionsShared || 0;
        case "comment-session":
            return userProgress?.noOfSessionsCommented || 0;
        case "attend-session":
            return userProgress?.noOfSessionsAttended || 0;
        case "host-session":
            return userProgress?.noOfSessionsHosted || 0;
        case "cohost-session":
            return userProgress?.noOfTimesBecameCoHost || 0;
        case "add-friend":
            return userProgress?.totalFollowing || 0;
        case "get-follower":
            return userProgress?.totalFollowers || 0;
        case "follow-others":
            return userProgress?.totalFollowing || 0;
        case "comment-liked-by-post-author":
            return userProgress?.commentsLikedByAuthor || 0;
        case "comment-liked-by-session-host":
            return userProgress?.commentsLikedByHost || 0;
        case "provide-social-links":
            return userProgress?.hasProvidedSocialLinks ? 1 : 0;
        case "set-profile-picture":
            return userProgress?.hasProfilePicture ? 1 : 0;
        case "set-personal-info":
            return userProgress?.hasSetPersonalInfo ? 1 : 0;
        case "create-group":
            return userProgress?.noOfGroups || 0;
        case "join-group":
            return userProgress?.noOfGroupsJoined || 0;
        case "chat-with-user":
            return userProgress?.noOfChats || 0;
        default:
            return 0;
    }
};


const Achievements = () => {
    const location = useLocation();
    const { achievements } = useAchievements();
    const userInfo = location.state?.userInfo || {};
    const userProgress = location.state?.userProgress || {};

    const [achievementsToShow, setAchievementsToShow] = useState(null);
    const [showAllAchievements, setShowAllAchievements] = useState(false);

    const showAchievements = (achievements) => {
        setShowAllAchievements(true);
        setAchievementsToShow(achievements);
    }

    const handleCloseModal = () => {
        setAchievementsToShow(null);
        setShowAllAchievements(false);
    }

    return (
        <div className='achievements-container'>
            <h1>Achievements</h1>
            <div className='main-achievements'>
                {
                    achievements?.map((achievement, index) => {
                        return (
                            <AchievementCard 
                                key={index} 
                                achievement={achievement} 
                                userProgress={userProgress}
                                userInfo={userInfo}
                                showAchievements={showAchievements}
                            />
                        )
                    })
                }
            </div>

            <Modal isOpen={showAllAchievements} onClose={handleCloseModal} modalType={"center"}>
                <ShowAchievementByCategory achievements={achievementsToShow} userProgress={userProgress} getProgress={getProgress} />
            </Modal>
        </div>
    )
}

const AchievementCard = ({ achievement, userInfo, userProgress, showAchievements }) => {
    const achievementProgress = getProgress(userProgress, achievement._id);
    const inCompleteAchievement = achievement.achievements.find(a => !userProgress[a._id] && achievementProgress < a.target );

    return (
        <div className='achievement-card' key={inCompleteAchievement?._id} onClick={() => showAchievements(achievement.achievements)}>
            <header className='achievement-header'>{achievement?._id}</header>
            <p className='todo'>{inCompleteAchievement?.description}</p>
            <p className='total-levels'>{`Lv. ${achievement?.count}`}</p>
            <div className='completed-levels'>
                {
                    achievement.achievements.map(v => {
                        return <span className='dot' style={{background: (!!userInfo?.completedAchievements[v._id] || achievementProgress >= v.target) ? 'var(--main-color)' : 'var(--secondary-color)'}}></span>
                    })
                }
            </div>
            <footer className='achievement-footer'>{`Progress: ${achievementProgress}/${inCompleteAchievement.target}`}</footer>
        </div>
    );
};

export default Achievements;