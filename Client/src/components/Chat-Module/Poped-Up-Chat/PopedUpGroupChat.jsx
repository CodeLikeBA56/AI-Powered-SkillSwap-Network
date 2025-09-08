import './PopedUpChat.css';
import React from 'react';
import truncateTitle from '../../../services/Strings.js';
import { useChat } from '../../../context/ChatProvider.jsx';

const PopedUpGroupChat = React.memo(({ groupChat, isFavourite, isClosing, formatLastMessageDate }) => {
    const { selectedGroupChat, switchGroupChat } = useChat();
    const username = groupChat?.lastMessage?.sender?.username;

    return (
      <div 
        className={`chat poped-up-chat ${isClosing ? 'reverse' : ''}`}
        onClick={() => {
          if (selectedGroupChat?._id !== groupChat._id) switchGroupChat(groupChat._id);
        }}
      >
        <img
          src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${groupChat?.profile}`}
          alt={groupChat?.name}
          className='profile-picture'
        />
        <div className='chat-info'>
          <h4 className='username'>{groupChat?.name}</h4>
          {groupChat?.lastMessage && (
            <>
              <p className='last-message'>
                {`${username}: ${truncateTitle(groupChat?.lastMessage?.content, 27)}`}
              </p>
              <p className='last-message-date'>{formatLastMessageDate(groupChat?.lastMessage?.createdAt)}</p>
            </>
          )}
        </div>
  
        {isFavourite && ( <span className='favourite-chat-icon'>🎀</span> )}
      </div>
    );
  });

export default PopedUpGroupChat;