import "../Followers-List/Followers-list.css";
import React, { useState } from "react";
import axiosInstance from "../../../api/axios.js";
import { useUserProfile } from "../../../context/UserProfileProvider.jsx";

const FollowingList = ({ following }) => {
  const { userInfo, followUser, unfollowUser } = useUserProfile();
  const list = following.map(f => {
    return {...f, isFollowing: userInfo?.following.some(u => u._id === f._id)}
  });
  const [followingList, setFollowingList] = useState(list);

  const handleToggleFollow = async (user) => {
    try {
      if (user.isFollowing) {
        unfollowUser(user._id);
      } else {
        const newFollower = { _id: user._id, username: user.username, profilePicture: user.profilePicture };
        followUser(user._id, newFollower);
      }

      const updatedList = followingList.map((u) => {
        if (u._id === user._id) {
          return { ...u, isFollowing: !u.isFollowing };
        }
        return u;
      });

      setFollowingList(updatedList);
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  return (
    <div className="list-container">
      {followingList?.length > 0 ? (
        followingList?.map((user) => (
          <div key={user._id} className="user-item">
            <img 
              src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${user.profilePicture}`}
              alt={user.username} 
              className="user-avatar"
              />
            <span className="username">{user.username}</span>
            {
              userInfo?._id !== user._id && (
                <button
                  className={user.isFollowing ? "unfollow-btn" : "follow-btn"}
                  onClick={() => handleToggleFollow(user)}
                >
                  {user.isFollowing ? "Unfollow" : userInfo?.followers.some(f => f._id === user._id) ? "Follow back": "Follow"}
                </button>
              )
            }
          </div>
        ))
      ) : (
        <p className="no-results">You're not following anyone.</p>
      )}
    </div>
  );
};

export default FollowingList;