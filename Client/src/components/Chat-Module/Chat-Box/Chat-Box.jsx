import './Chat-Box.css';
import Message from '../Message/Message.jsx';
import ChatInfo from '../Chat-Info/Chat-Info.jsx';
import { sortByDate } from '../../../services/Date.js';
import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../../../context/ChatProvider.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import MediaInputForm from '../../Forms/MediaInputForm/MediaInputForm.jsx';
import MediaPreview from '../../MediaPreview/MediaPreview.jsx';

const ChatBox = () => {
  const { userInfo, uploadMediaToDB, getUserProfile } = useUserProfile();
  const { selectedChat, sendMessage, chatMessages } = useChat();

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
  }, [selectedChat._id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatMessages, selectedChat]);

  const handleSendMessage = async () => {
    const chatId = selectedChat._id;
    const participant = selectedChat.participants._id;

    let media = [];
    if (attachments?.length)
      media = await uploadMediaToDB(attachments, "group-chat-media");

    const messageObj = { 
      chat: chatId,
      sender: userInfo?._id,
      attachments: media.length ? media : null,
      content: message.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (replyTo?._id)
      messageObj.replyTo = replyTo._id;

    sendMessage(chatId, messageObj, participant, replyTo);

    setMessage('');
    setAttachments([]);
    setIsReplying(false);
    setReplyTo({});
  }
  
  const handleHideReplyTo = () => {
    setIsReplying(false);
    setReplyTo({});
  }

  const profilePicURL = getUserProfile(selectedChat?.participants?.username, selectedChat?.participants?.profilePicture);

  return (
    <div className='chat-box'>
      <header className='chat-header'>
        <img 
          className='contact-profile' 
          src={profilePicURL}
          alt='User Profile'
        />
        <div className='contact-detail'>
          <h3 className='contact-name'>{selectedChat?.participants?.username}</h3>
        </div>

        <button className='chat-info-btn' onClick={() => setShowChatInfo(true)}>i</button>

      </header>

      <div 
        className='chat-messages'
        style={{height: `calc(100vh - 70px - 20px - ${isReplying ? '140px' : '80px'})`}}
      >
        { 
          chatMessages[selectedChat?._id] && Object.keys(chatMessages[selectedChat?._id]).sort(sortByDate).map((date, i) => (
            <React.Fragment key={date}> 
              <span className='message-date'>{date}</span>
              {
                chatMessages[selectedChat?._id][date].map((msg) => (
                  <Message 
                    key={msg._id} 
                    message={msg}
                    setReplyTo={setReplyTo}
                    setIsReplying={setIsReplying}
                    showOptions={optionsMessageId === msg._id}
                    setOptionsMessageId={setOptionsMessageId}
                  />
                ))
              }
            </React.Fragment>
          ))
        }
        <div ref={messagesEndRef} />
      </div>

      <div className='send-message-box-wrapper'>
        {
          0 !== attachments.length && 
          <MediaPreview
            mediaToPreview={attachments}
            setMediaToPreview={setAttachments}
          />
        }
        
        {
          Object.keys(replyTo).length !== 0 && (
            <div className='reply-to-container'>
              <div className={`replyTo ${isReplying ? 'showing' : ''}`}>
                <h4>Replying to {replyTo.sender === userInfo?._id ? "yourself" : selectedChat?.participants?.username}</h4>
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

          <button type='button' style={{filter: ( attachments.length || message.trim()) ? "grayScale(0%)" : "grayscale(100%)"}} disabled={(attachments.length === 0 && message.trim() === '')} id='send-btn' onClick={handleSendMessage}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-send" id='send-icon' viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
          </button>
        </div>
      </div>

      <ChatInfo showChatInfo={showChatInfo} setShowChatInfo={setShowChatInfo} />        
    </div>
  );
};

export default ChatBox;