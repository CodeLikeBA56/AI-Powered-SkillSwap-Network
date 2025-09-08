import './GroupChatBox.css';
import '../Chat-Box/Chat-Box.css';
import "../Message/GroupMessage.css";
import { sortByDate } from '../../../services/Date.js';
import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../../../context/ChatProvider.jsx';
import GroupChatInfo from '../Group-Chat-Info/GroupChatInfo.jsx';
import GroupEventMessage from '../Message/GroupEventMessage.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import MediaPreview from '../../MediaPreview/MediaPreview.jsx';
import MediaInputForm from '../../Forms/MediaInputForm/MediaInputForm.jsx';
import AttachmentPreview from '../Message/AttachmentPreview.jsx';

const GroupChatBox = () => {
  const { userInfo, uploadMediaToDB, getUserProfile } = useUserProfile();
  const { selectedGroupChat, sendGroupMessage, groupChatMessages } = useChat();

  const messagesEndRef = useRef(null);
  const [replyTo, setReplyTo] = useState({});
  const [isReplying, setIsReplying] = useState(true);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [optionsMessageId, setOptionsMessageId] = useState(null);

  useEffect(() => {
    setShowChatInfo(false);
    setMessage('');
    setIsReplying(false);
    setReplyTo({});
  }, [selectedGroupChat._id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [groupChatMessages, selectedGroupChat]);

  const handleSendMessage = async (selectedChat) => {
    const chatId = selectedChat._id;
    const participants = selectedChat.participants.map(p => p._id);
  
    const mentions = [];
    let media = [];
    if (attachments?.length)
      media = await uploadMediaToDB(attachments, "group-chat-media");

    const messageObj = {
      group: chatId,
      sender: userInfo?._id,
      content: message.trim(),
      attachments: media.length ? media : null,
      mentions,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants,
    };
    
    if (replyTo?._id)
      messageObj.replyTo = replyTo._id;

    sendGroupMessage(chatId, messageObj, replyTo);
    setMessage('');
    setAttachments([]);
    setIsReplying(false);
    setReplyTo({});
  }
  
  const handleHideReplyTo = () => {
    setIsReplying(false);
    setReplyTo({});
  }

  const profilePicURL = getUserProfile(selectedGroupChat?.name, selectedGroupChat?.profile, "group-chat-media");

  return (
    <div className='chat-box'>
      <header className='chat-header'>
        <img 
          className='contact-profile' 
          src={profilePicURL}
          alt='User Profile'
        />
        <div className='contact-detail'>
          <h3 className='contact-name'>{selectedGroupChat?.name}</h3>
          <span className='group-chat-participants'>{
            selectedGroupChat?.participants?.map(user => user.username).join(", ")
          }</span>
        </div>

        <button className='chat-info-btn' onClick={() => setShowChatInfo(true)}>i</button>

      </header>

      <div 
        className='chat-messages'
        style={{height: `calc(100vh - 70px - 20px - ${isReplying ? '140px' : '80px'})`}}
      >
        { 
            groupChatMessages[selectedGroupChat?._id] && Object.keys(groupChatMessages[selectedGroupChat?._id]).sort(sortByDate).map((date, i) => (
            <React.Fragment key={date}> 
              <span className='message-date'>{date}</span>
              {
                groupChatMessages[selectedGroupChat?._id][date].map((msg) => (
                  msg.type === "message" ? 
                    <Message 
                        key={msg._id} 
                        message={msg}
                        setReplyTo={setReplyTo}
                        setIsReplying={setIsReplying}
                        showOptions={optionsMessageId === msg._id}
                        setOptionsMessageId={setOptionsMessageId}
                    />
                  :
                    <GroupEventMessage key={msg._id} event={msg} />
                ))
              }
            </React.Fragment>
          ))
        }
        <div ref={messagesEndRef} />
      </div>

      <div className='send-message-box-wrapper'>
        {
          0 !== attachments.length && (
            <MediaPreview 
              mediaToPreview={attachments}
              setMediaToPreview={setAttachments}
            />
          )
        }

        {
          Object.keys(replyTo).length !== 0 && (
            <div className='reply-to-container'>
              <div className={`replyTo ${isReplying ? 'showing' : ''}`}>
                <h4>Replying to {replyTo.sender._id === userInfo?._id ? "yourself" : replyTo?.sender?.username}</h4>
                <p>{replyTo.content}</p>
              </div>

              <button type='button' className='hide-reply-container-btn' onClick={handleHideReplyTo}>
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>
          )
        }

        <div className='send-message-box'>
          <MediaInputForm 
            setAttachedMedia={setAttachments}
            attachedMedia={attachments}
            mediaType="all" // "document/*", "image/*", "video/*" or "all"
            maxMediaLimit={4}
          />

          <input 
            type='text'
            value={message}
            className='message-input'
            placeholder='Type a message...'
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* todo: handle send message process. */}
          {/* todo: handle real time messages using io socket or webRTC. */}

          <button type='button' style={{filter: ( attachments.length || message.trim()) ? "grayScale(0%)" : "grayscale(100%)"}} disabled={(attachments.length === 0 && message.trim() === '')} id='send-btn' onClick={() => handleSendMessage(selectedGroupChat)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-send" id='send-icon' viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
          </button>
        </div>
      </div>

      <GroupChatInfo showChatInfo={showChatInfo} setShowChatInfo={setShowChatInfo} />        
    </div>
  );
};

export default GroupChatBox;

const Message = ({ message, setReplyTo, setIsReplying, showOptions, setOptionsMessageId }) => {
  const { userInfo } = useUserProfile();
  const { selectedGroupChat, deleteMessageForMe, deleteMessageForEveryone } = useChat();

  const formatToTime = (messageDate) => {
    const date = new Date(messageDate);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleString('en-US', options).replace(',', '');
  };

  const isMine = message.sender._id === userInfo?._id;
  const [isClosing, setIsClosing] = useState(false);

  const hideChatOptions = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOptionsMessageId(null);
      setIsClosing(false);
    }, 500);
  };

  let pressTimer;

  const handleLongPressStart = () => {
    pressTimer = setTimeout(() => {
      setOptionsMessageId(message._id);
    }, 550);
  };

  const clearLongPress = () => clearTimeout(pressTimer);

  const handleDeleteForMe = () => { 
    const chat = selectedGroupChat?._id;
    const msg = message?._id;
    const dateKey = new Date(message?.createdAt).toLocaleDateString('en-GB');
    
    deleteMessageForMe(chat, dateKey, msg);
  };
  
  const handleDeleteForEveryone = () => { 
    const chat = selectedGroupChat?._id;
    const msg = message?._id;
    const dateKey = new Date(message?.createdAt).toLocaleDateString('en-GB');
    
    deleteMessageForEveryone(chat, dateKey, msg);
  };

  const handleReply = () => {
    hideChatOptions();
    const replyTo = { _id: message._id, content: message.content, sender: message.sender };
    setReplyTo(replyTo);
    setIsReplying(true);
  };

  return (
    <>
      <div 
        id={`message-${message?._id}`}
        className={isMine ? "my-message" : "recipient-message"}
        onMouseDown={handleLongPressStart}
        onTouchStart={handleLongPressStart}
        onMouseUp={clearLongPress}
        onMouseLeave={clearLongPress}
        onTouchEnd={clearLongPress}
      >
        <div className={isMine ? "my-message-content" : "recipient-message-content"}>
          {
            message?.replyTo && (
                <div className='reply-to-header'>
                    <span className='replied-to'>
                        {
                            message?.replyTo?.sender?._id === userInfo?._id? 
                                "You" : `${message?.replyTo?.sender?.username}`
                        }
                    </span>
                    <p>{message?.replyTo?.content}</p>
                </div>
            )
          }
          { !isMine && <span className='message-by'>{selectedGroupChat.nicknames[message.sender._id]}</span>}
          { message.attachments && 0 !== message.attachments?.length && <AttachmentPreview attachments={message.attachments} isMine={isMine} /> }
          <p>{message.content}</p>
        </div>
        <div className='message-footer'>
          <p className={isMine ? "my-message-time" : "recipient-message-time"}>
            {formatToTime(message.createdAt)}
          </p>
          { 
            isMine && 
            <span
              style={{ color: message.isRead ? 'var(--white-color)' : 'var(--shadow-color)' }}
              className="material-symbols-outlined message-result"
            >
              {message.isDelivered ? "done_all" : "check"}
            </span>
          }
        </div>

        {showOptions && (
          <>
            <div className={`message-options-popup ${isClosing ? 'closing' : 'showing'}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleReply()}>Reply</button>
              <button onClick={() => handleDeleteForMe()}>Delete for me</button>
              {isMine && <button onClick={() => handleDeleteForEveryone()}>Delete for everyone</button>}
            </div>
          </>
          )
        }

      </div>

      { showOptions && <div className={`message-options-backdrop`} onClick={(e) => {e.stopPropagation(); hideChatOptions()}} /> }
    </>
  );
};