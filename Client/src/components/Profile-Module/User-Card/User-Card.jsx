import React, { useState } from 'react';
import SkillsList from '../Skills-List/Skills-List.jsx';
import { useChat } from '../../../context/ChatProvider.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import { useRecommendation } from '../../../context/RecommendationProvider.jsx';

const UserCard = ({ user }) => {
    const { initiateChat } = useChat();
    const { setSuggestedUsers } = useRecommendation();
    const { userInfo, redirectToUserProfile, followUser, unfollowUser } = useUserProfile();

    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(userInfo?.following?.some(f => f._id === user._id));

    const handleToggleFollow = async (targetedUserId) => {
        setIsLoading(true);

        if(isFollowing === true) {
            await unfollowUser(targetedUserId);

            setSuggestedUsers(preUsers => preUsers.map(user => {
                return user._id === targetedUserId ? {...user, followers: user.followers.filter(f => f._id !== userInfo._id)} : user;
            }));

            setIsFollowing(false);
        } else {
            const newFollowedUser = {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            }
            
            const newFollower = await followUser(targetedUserId, newFollowedUser);
            
            if (newFollower) {
                setIsFollowing(true);
                setSuggestedUsers(preUsers => preUsers.map(user => {
                    return user._id === targetedUserId ? {...user, followers: [...user.followers, newFollower]} : user
                }));
            }
        }

        setIsLoading(false);
    }

    return (
        <article className='suggested-user'>
            <div className='suggested-user-detail'>
                <button 
                    type='button' 
                    className='view-profile-btn' 
                    onClick={() => redirectToUserProfile(user._id)}
                >
                    <img 
                        className='suggested-user-profile'
                        src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${user.profilePicture}`}
                        alt={user.username}
                    />
                </button>
                <div className='suggested-user-name'>{user.username}</div>
            </div>

            <div>
                <SkillsList title="Offered Skills" skills={user.offeredSkills} />
                <SkillsList title="Desired Skills" skills={user.desiredSkills} />
            </div>

            <div className='suggested-user-actions'>
                <button type='button' onClick={() => initiateChat(user._id, user.username, user.profilePicture)}>Message</button>
                <button 
                    type='button' 
                    disabled={isLoading}
                    onClick={() => handleToggleFollow(user._id)}
                    style={{ backgroundColor: isFollowing ? "var(--shadow-color)" : "" }}
                >
                    {isFollowing === true ? "Unfollow" : "Follow"}
                </button>
            </div>
        </article>
    );
};

export default UserCard;