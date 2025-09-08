import './UserTag.css';
import React from 'react';

const UserTag = ({ username, profilePicture }) => {

    const profilePicURL = `${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${profilePicture}`;
    return (
        <div className="user-tag">
            <img src={profilePicURL} alt={username} className="profile-pic" />
            <span className="username">{username}</span>
        </div>
    );
};

export default UserTag;