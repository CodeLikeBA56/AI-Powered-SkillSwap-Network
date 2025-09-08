import './Suggestions.css';
import axiosInstance from '../../api/axios';
import React, { useState, useEffect } from 'react';
import { useRecommendation } from '../../context/RecommendationProvider';
import { useUserProfile } from '../../context/UserProfileProvider';

const FriendsSuggestions = () => {
    const { suggestedUsers, setSuggestedUsers } = useRecommendation();
    const { userInfo, redirectToUserProfile, followUser, unfollowUser } = useUserProfile();

    const handleToggleFollow = async (e, user) => {
        const button = e.target;
        button.disabled = true

        try {
            const isFollowing = userInfo?.following?.some(f => f._id === user._id);
    
            if (isFollowing) {
                await unfollowUser(user._id);
                setSuggestedUsers(prevUsers => prevUsers.map(u => {
                    return u._id === user._id ? { ...u, followers: u.followers.filter(f => f._id !== userInfo?._id) } : u
                }));
                button.classList.add("unfollow");
                button.innerText = "Follow";
            } else {
                const newFollowedUser = { _id: user._id, username: user.username, profilePicture: user.profilePicture };
                const newFollower = await followUser(user._id, newFollowedUser);
                if (newFollower) {
                    setSuggestedUsers(prevUsers => prevUsers.map(u => {
                        return u._id === user._id ? { ...u, followers: [...u.followers, newFollower] } : u
                    }));
                }
                button.classList.remove("unfollow");
                button.innerText = "Unfollow";
            }
        } catch (error) {
            console.error("Follow/Unfollow Error:", error);
        } finally {
            button.disabled = false;
        }
    };    

    return (
        suggestedUsers.length > 0 && <div className='friends-suggestion-container'>
            <h4 className='suggestion-title'>Suggested for you</h4>
            <ul className='friends-suggestion-list'>
                {suggestedUsers.map((user, index) => (
                    <li className='friend-suggestion' key={index}>
                        <div className='suggested-friend-detail'>
                            <button 
                                type='button' 
                                className='view-profile-btn' 
                                onClick={() => redirectToUserProfile(user._id)}
                            >
                                <img 
                                    className='profile-picture'
                                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${user.profilePicture}`}
                                    alt={user.username}
                                />
                            </button>
                            <div className='suggested-person-detail'>
                                <h4 className='username'>{user.username}</h4>
                                <p className='message'>Suggested for you</p>
                            </div>
                        </div>
                        <button 
                            type='button' 
                            onClick={(e) => handleToggleFollow(e, user)}
                            className={userInfo?.following?.some(f => f._id === user._id) ? 'follow-btn unfollow' : 'follow-btn' }
                        >{userInfo?.following?.some(f => f._id === user._id) ? "Unfollow" : "Follow"}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendsSuggestions;