import './RoundUserTag.css';
import React, { useMemo } from 'react';
import { useUserProfile } from '../../../context/UserProfileProvider';

const RoundUserTag = ({ user, isSelected = false, handleSharePostWith }) => {
  const { getUserProfile } = useUserProfile();
  const profilePicURL = getUserProfile(user?.username, user?.profilePicture);

  return (
    <div className='round-user-tag' onClick={() => handleSharePostWith(user)}>
      <img
        src={profilePicURL}
        className='user-profile'
        alt={user.username}
      />
      <span className='username'>{user.username}</span>
      {isSelected && <span className='material-symbols-outlined selected-user'>check</span>}
    </div>
  );
};

export default RoundUserTag;