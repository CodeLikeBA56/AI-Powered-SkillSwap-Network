import './PopedUpChat.css';
import React from 'react';
import truncateTitle from '../../../services/Strings.js';
import { useChat } from '../../../context/ChatProvider.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';

const PopedUpChat = React.memo(({ chat, isFavourite, isClosing, formatLastMessageDate }) => {
  const { getUserProfile } = useUserProfile();  
  const { selectedChat, switchChat } = useChat();

    const chatPartner = chat.participants;
    const profilePictureURL = getUserProfile(chatPartner.username, chatPartner.profilePicture);
  
    return (
      <div 
        className={`chat poped-up-chat ${isClosing ? 'reverse' : ''}`}
        onClick={() => {
          if (selectedChat?._id !== chat._id) switchChat(chat._id);
        }}
      >
        <img
          src={profilePictureURL}
          alt={chatPartner?.username}
          className='profile-picture'
        />
        <div className='chat-info'>
          <h4 className='username'>{chat?.nicknames[chatPartner?._id]}</h4>
          {chat?.lastMessage && (
            <>
              <p className='last-message'>{chat?.lastMessage?.content? truncateTitle(chat?.lastMessage?.content, 27) : ""}</p>
              <p className='last-message-date'>{chat?.lastMessage?.createdAt ? formatLastMessageDate(chat?.lastMessage?.createdAt) : ""}</p>
            </>
          )}
        </div>
  
        {isFavourite && ( <span className='favourite-chat-icon'>🎀</span> )}
      </div>
    );
  });

export default PopedUpChat;