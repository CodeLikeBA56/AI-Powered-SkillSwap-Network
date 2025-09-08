import './SuggestedGroupCard.css';
import React, { useState } from 'react';
import Image from '../../assets/JavaScript.webp';
import { useChat } from '../../context/ChatProvider';
import { useUserProfile } from '../../context/UserProfileProvider';
import { useRecommendation } from '../../context/RecommendationProvider';
import { useNavigate } from 'react-router-dom';

const SuggestedGroupCard = React.memo(({ group }) => {
  const navigate = useNavigate();
  const { setSuggestedGroups } = useRecommendation();
  const { userInfo, getUserProfile } = useUserProfile();
  const { handleJoinGroup, switchGroupChat } = useChat();

  const [isGroupJoined, setIsGroupJoined] = useState(() => {
    return group.participants.some(p => p._id === userInfo?._id);
  });

  const joinGroup = async (groupId) => {
    try {
      await handleJoinGroup(groupId);
      setSuggestedGroups(prev => prev.map(group => {
        if (group._id === groupId) {
          const newParticipant = { _id: userInfo._id, username: userInfo.username, profilePicture: userInfo.profilePicture };
          const updatedParticipants = [...group.participants, newParticipant];
          return { ...group, participants: updatedParticipants };
        }

        return group;
      }));

      setIsGroupJoined(true);
    } catch (error) {}
  }

  const groupProfile = getUserProfile(group.name, group.profile, "group-chat-media");

  return (
    <div className='suggested-group-card'>
      <img 
          src={groupProfile}
          alt='Group Profile'
      />
      <span className='group-name'>{group?.name}</span>
      <p className='group-description'>{group?.description}</p>

      {
        !isGroupJoined && (
          <button 
            type='button' className='join-group-btn' 
            onClick={() => joinGroup(group._id)}
          >Join Group</button>
        )
      }

      {
        isGroupJoined && (
          <button 
            type='button' className='join-group-btn' 
            onClick={() => {
              switchGroupChat(group._id);
              navigate("/dashboard/chat")
            }}
          >View Group</button>
        )
      }
      <p className='admin-info'>Admin: {group?.admin?.username}</p>
    </div>
  )
});

export default SuggestedGroupCard;