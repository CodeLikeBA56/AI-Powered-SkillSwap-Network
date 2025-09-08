import React, { useState } from "react";
import profile from '../../../assets/No-Profile.webp'
import PopedUpGroupChat from "../Poped-Up-Chat/PopedUpGroupChat";
import { useChat } from "../../../context/ChatProvider";
import truncateTitle from "../../../services/Strings";
import { useUserProfile } from "../../../context/UserProfileProvider";

const GroupChatItem = React.memo(({ chat, showOptions, setOptionsChatId }) => {
  const { userInfo } = useUserProfile();
  const { deleteGroup, selectedGroupChat, switchGroupChat, handleLeaveGroup, addGroupChatToFavourites, removeGroupChatFromFavourites } = useChat();

  const [isClosing, setIsClosing] = useState(false);
  const isFavourite = chat?.isFavourite[userInfo?._id] || false;
  
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
    if (isFavourite)
      removeGroupChatFromFavourites(chatId);
    else
      addGroupChatToFavourites(chatId);

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
          className={`chat ${selectedGroupChat?._id === chat._id ? 'active' : ''}`}
          onClick={() => {
            if (selectedGroupChat?._id !== chat._id && !showOptions) switchGroupChat(chat._id);
          }}
          onMouseDown={handleLongPressStart}
          onTouchStart={handleLongPressStart}
          onMouseUp={clearLongPress}
          onMouseLeave={clearLongPress}
          onTouchEnd={clearLongPress}
        >
          <img
            src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${chat.profile}`}
            alt={chat?.name}
            className='profile-picture'
            onError={(e) => e.target.src = profile}
          />
          <div className='chat-info'>
            <h4 className='username'>{chat?.name}</h4>
            {chat?.lastMessage && (
              <>
                <p className='last-message'>{chat?.lastMessage?.content? truncateTitle(chat?.lastMessage?.content, 33) : ""}</p>
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
              <PopedUpGroupChat groupChat={chat} isFavourite={isFavourite} isClosing={isClosing} formatLastMessageDate={formatLastMessageDate} />
  
              <div className={`chat-options ${isClosing ? 'reverse' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => toggleFavouriteChat(chat._id)}>
                  <span className='btn-text'>{isFavourite ? "Remove from favourites" : "Add to Favourites"}</span>
                  <span className='material-symbols-outlined btn-icon'>favorite</span>
                </button>
                {
                  chat?.admin?._id !== userInfo?._id && (
                    <button className='delete-chat-btn' onClick={() => handleLeaveGroup(chat?._id)}>
                      <span className='btn-text'>Leave Group</span>
                      <span className='material-symbols-outlined btn-icon'>logout</span>
                    </button>
                  )
                }
                {
                  chat?.admin?._id === userInfo?._id && (
                    <button className='delete-chat-btn' onClick={() => deleteGroup(chat._id)}>
                      <span className='btn-text'>Delete Group</span>
                      <span className='material-symbols-outlined btn-icon'>delete</span>
                    </button>
                  )
                }
              </div>
            </div>
          </>
        )}
      </>
    );
});

export default GroupChatItem;