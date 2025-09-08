import "./Followers-list.css";
import React, { useState } from "react";
import { useUserProfile } from "../../../context/UserProfileProvider";

const FollowersList = ({ followers }) => {
  const { userInfo, followUser, unfollowUser } = useUserProfile();
  const list = followers.map(f => {
    return {...f, isFollowing: userInfo?.following.some(u => u._id === f._id)}
  });
  const [followersList, setFollowersList] = useState(list);

  return (
    <div className="list-container">
      {followersList?.length > 0 ? (
        followersList?.map((follower) => (
          <div key={follower._id} className="user-item">
            <img 
              src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${follower.profilePicture}`} 
              alt={follower.username} 
              className="user-avatar"
            />
            <span className="username">{follower.username}</span>
            {
              userInfo?._id !== follower._id && (
                <button
                  className={follower.isFollowing ? "unfollow-btn" : "follow-btn"}
                  onClick={() => handleToggleFollow(follower)}
                >
                  {follower.isFollowing ? "Unfollow" : userInfo?.followers.some(f => f._id === follower._id) ? "Follow back": "Follow"}
                </button>
              )
            }
          </div>
        ))
      ) : (
        <p className="no-results">No followers yet.</p>
      )}
    </div>
  );
};

export default FollowersList;