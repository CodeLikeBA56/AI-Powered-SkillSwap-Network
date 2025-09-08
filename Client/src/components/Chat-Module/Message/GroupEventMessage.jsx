import './Message.css';
import React from 'react';
import { useUserProfile } from '../../../context/UserProfileProvider';

const GroupEventMessage = ({ event }) => {
  const { userInfo, redirectToUserProfile } = useUserProfile();
  const senderId = event.sender?._id;
  const targetId = event.target?._id;
  const senderName = event.sender?.username;
  const targetName = event.target?.username;

  const handleUserClick = (userId) => {
    redirectToUserProfile(userId, "/dashboard/chat", "Chat")
  }

  const renderMessage = () => {
    switch (event.eventType) {
      case 'added':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              { event?.sender?._id === userInfo?._id ? "You" : senderName}
            </button>
            <span className="event-action"> added </span>
            <button className="event-user target" onClick={() => handleUserClick(targetId)}>
              { event?.target?._id === userInfo?._id ? "you" : targetName}
            </button>
          </>
        );
      case 'left':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              {senderName}
            </button>
            <span className="event-action"> left the group </span>
          </>
        );
      case 'join':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              {senderName}
            </button>
            <span className="event-action"> join the group</span>
          </>
        );
      case 'removed':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              { event?.sender?._id === userInfo?._id ? "You" : senderName}
            </button>
            <span className="event-action"> removed </span>
            <button className="event-user target" onClick={() => handleUserClick(targetId)}>
              {targetName}
            </button>
          </>
        );
      case 'admin_assigned':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              {senderName}
            </button>
            <span className="event-action"> made </span>
            <button className="event-user target" onClick={() => handleUserClick(targetId)}>
              {targetName}
            </button>
            <span className="event-action"> an admin </span>
          </>
        );
      case 'nickname_changed':
        return (
          <>
            <button className="event-user sender" onClick={() => handleUserClick(senderId)}>
              { event?.sender?._id === userInfo?._id ? "You" : senderName}
            </button>
            <span className="event-action"> changed </span>
            <button className="event-user target" onClick={() => handleUserClick(targetId)}>
              { event?.target?._id === userInfo?._id ? "your" : event?.target._id === event?.sender?._id ? "their" : targetName}
            </button>
            <span className="event-action">{event?.target?._id === userInfo?._id || event?.target._id === event?.sender?._id ? 'nickname to' : `’s nickname to `}</span>
            <span className="event-meta">"{event.meta?.newNickname}"</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div key={event._id} className="event-message">
      {renderMessage()}
    </div>
  );
};

export default GroupEventMessage;