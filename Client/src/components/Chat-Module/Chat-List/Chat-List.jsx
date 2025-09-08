import './Chat-List.css';
import Modal from '../../Custom/Modal.jsx';
import React, { useState, useEffect, useRef } from 'react';
import profile from '../../../assets/No-Profile.webp'
import PopedUpChat from '../Poped-Up-Chat/PopedUpChat.jsx';
import { useChat } from '../../../context/ChatProvider.jsx';
import CreateGroupForm from '../../Forms/CreateGroupForm.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import truncateTitle from '../../../services/Strings.js';
import SearchUser from '../Search-Users/SearchUser.jsx';

import GroupChatItem from './GroupChatItem.jsx';

const ChatList = () => {
  const { userInfo } = useUserProfile();
  const { chats, groupChats, handleCloseModal, showSearchUserModel, setShowSearchUserModel, showCreateGroupChatForm } = useChat();
 
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [optionsChatId, setOptionsChatId] = useState(null);

  return (
    <div className='chat-list-container'>
      <div className='class-list-header'>
        <h1>Contacts</h1>
        <button type='button' className='add-chat-btn' onClick={() => setShowSearchUserModel(true)}>
          <span className='material-symbols-outlined'>add</span>
        </button>
      </div>
      {/* <div className='searchbar-container'>
        <input
          type='text'
          className='searchbar'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search'
        />
        <button className='search-btn'>
          <i className='bx bx-search'></i>
        </button>
      </div> */}

      <ul className='filters'>
        {['All', 'Chats', 'Group Chats', 'Favourites'].map(filter => (
          <li
            key={filter}
            className={`filter ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </li>
        ))}
      </ul>

      <div className='chat-list'>
        {(activeFilter === 'All' || activeFilter === 'Chats') && chats && chats.map(chat => (
          <ChatItem
            key={chat._id}
            chat={chat}
            showOptions={optionsChatId === chat._id}
            setOptionsChatId={setOptionsChatId}
          />
        ))}

        {(activeFilter === 'All' || activeFilter === 'Group Chats') && groupChats && groupChats.map(chat => (
          <GroupChatItem
            key={chat._id}
            chat={chat}
            showOptions={optionsChatId === chat._id}
            setOptionsChatId={setOptionsChatId}
          />
        ))}

        {activeFilter === 'Favourites' && chats.filter(c => userInfo.favouriteChats.includes(c._id)).map(chat => (
          <ChatItem
            key={chat._id}
            chat={chat}
            showOptions={optionsChatId === chat._id}
            setOptionsChatId={setOptionsChatId}
          />
        ))}

        {activeFilter === 'Favourites' && groupChats.filter(c => c.isFavourite[userInfo?._id]).map(chat => (
          <GroupChatItem
            key={chat._id}
            chat={chat}
            showOptions={optionsChatId === chat._id}
            setOptionsChatId={setOptionsChatId}
          />
        ))}
      </div>

      <Modal
          title={showCreateGroupChatForm ? "Create Group" : "New message"}
          isOpen={showSearchUserModel}
          onClose={handleCloseModal}
          modalType={"center"}
          children={showCreateGroupChatForm ? <CreateGroupForm /> : <SearchUser />}
        />
    </div>
  );
};

export default ChatList;

const ChatItem = React.memo(({ chat, showOptions, setOptionsChatId }) => {
  const { selectedChat, switchChat, deleteChat } = useChat();
  const { userInfo, getUserProfile, addChatToFavourites, removeChatFromFavourites } = useUserProfile();

  const chatPartner = chat.participants;
  const profilePictureURL = getUserProfile(chatPartner?.username, chatPartner?.profilePicture);

  const [isClosing, setIsClosing] = useState(false);
  const [isFavourite, setIsFavourite] = useState(() => {
    return userInfo?.favouriteChats?.includes(chat._id);
  });

  const lastMessageRef = useRef(null);
  const [truncatedMessage, setTruncatedMessage] = useState('');

  useEffect(() => {
    if (chat?.lastMessage?.content && lastMessageRef.current) {
      const width = lastMessageRef.current.offsetWidth;
      setTruncatedMessage(truncateTitle(chat.lastMessage.content, width / 10));
    } else if (chat.lastMessage?.post) {
      setTruncatedMessage("Shared a post");
    } else if (chat.lastMessage?.session) {
      setTruncatedMessage("Shared a session");
    } else if (chat.lastMessage?.attachments?.length) {
      setTruncatedMessage("Sent an attachment");
    }
  }, [chat?.lastMessage?.content]);

  const hideChatOptions = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOptionsChatId(null);
      setIsClosing(false);
    }, 500);
  };

  let pressTimer;

  const handleLongPressStart = () => {
    pressTimer = setTimeout(() => {
      setOptionsChatId(chat._id);
    }, 550);
  };

  const clearLongPress = () => clearTimeout(pressTimer);

  const toggleFavouriteChat = async (chatId) => {
    if (isFavourite === false)
      addChatToFavourites(chatId);
    else
      removeChatFromFavourites(chatId)

    setIsFavourite(prevStatus => !prevStatus);
    hideChatOptions();
  };

  const formatLastMessageDate = (dateString) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    return diffInHours < 24
      ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : messageDate.toLocaleDateString();
  };
  
  const handleDeleteChat = () => {
    hideChatOptions();

    setTimeout(() => {
      const chatId = chat._id;
      const participant = chat.participants._id;
      deleteChat(chatId, participant);
    }, 500);
  };  

  return (
    <>
      <div
        id={`chat-${chat._id}`}
        className={`chat ${selectedChat?._id === chat._id ? 'active' : ''}`}
        onClick={() => {
          if (selectedChat?._id !== chat._id && !showOptions) switchChat(chat._id);
        }}
        onMouseDown={handleLongPressStart}
        onTouchStart={handleLongPressStart}
        onMouseUp={clearLongPress}
        onMouseLeave={clearLongPress}
        onTouchEnd={clearLongPress}
      >
        <img
          src={profilePictureURL}
          alt={chatPartner?.username}
          className='profile-picture'
          onError={(e) => e.target.src = profile}
        />
        <div className='chat-info'>
          <h4 className='username'>{chat?.nicknames[chatPartner?._id]}</h4>
          {chat?.lastMessage && (
            <>
              <p ref={lastMessageRef} className='last-message'>{truncatedMessage}</p>
              <p className='last-message-date'>{chat?.lastMessage?.createdAt ? formatLastMessageDate(chat?.lastMessage?.createdAt) : ""}</p>
            </>
          )}
        </div>

        {isFavourite && (
          <button
            className='favourite-chat-icon'
            style={{ filter: !isFavourite ? "grayscale(100%)" : "" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavouriteChat(chat._id);
            }}
          >🎀</button>
        )}
      </div>

      {showOptions && (
        <>
          <div
            className={`chat-options-backdrop ${showOptions ? 'showing' : ''} ${isClosing ? 'closing' : ''}`}
            onClick={hideChatOptions}
          >
            <PopedUpChat chat={chat} isFavourite={isFavourite} isClosing={isClosing} formatLastMessageDate={formatLastMessageDate} />

            <div className={`chat-options ${isClosing ? 'reverse' : ''}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => toggleFavouriteChat(chat._id)}>
                <span className='btn-text'>{isFavourite ? "Remove from favourites" : "Add to Favourites"}</span>
                <span className='material-symbols-outlined btn-icon'>favorite</span>
              </button>
              <button className='delete-chat-btn' onClick={handleDeleteChat}>
                <span className='btn-text'>Delete Chat</span>
                <span className='material-symbols-outlined btn-icon'>delete</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
});