import './Message.css';
import React, { useState } from 'react';
import SharedPost from './SharedPost.jsx';
import { useChat } from '../../../context/ChatProvider.jsx';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import SharedSession from './SharedSession.jsx';
import AttachmentPreview from './AttachmentPreview.jsx';

const Message = React.memo(({ message, setReplyTo, setIsReplying, showOptions, setOptionsMessageId }) => {
    const { userInfo } = useUserProfile();
    const { selectedChat, deleteMessageForMe, deleteMessageForEveryone } = useChat();
  
    const formatToTime = (messageDate) => {
      const date = new Date(messageDate);
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      return date.toLocaleString('en-US', options).replace(',', '');
    };
  
    const isMine = message.sender._id == userInfo?._id;
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
      const chat = selectedChat?._id;
      const msg = message?._id;
      const dateKey = new Date(message?.createdAt).toLocaleDateString('en-GB');
      
      deleteMessageForMe(chat, dateKey, msg);
    };
    
    const handleDeleteForEveryone = () => { 
      const chat = selectedChat?._id;
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
                          { message?.replyTo?.content && <p>{message?.replyTo?.content}</p> }
                          
                          {
                            !message?.replyTo?.content && (
                              <p>{`Replied to a ${message.replyTo?.post ? "post" : message.replyTo.session ? "session" : "attachment"}.`}</p>
                            )
                          }
                      </div>
                  )
                }

                { message.attachments && 0 !== message.attachments?.length && <AttachmentPreview attachments={message.attachments} isMine={isMine} /> }
                { message?.post && <SharedPost post={message.post} /> }
                { message?.session && <SharedSession session={message.session} /> }
                <p>{message.content}</p>
            </div>
            <div className='message-footer' style={{marginTop: true === !message.content ? '8px' : '0px'}}>
                <p className={isMine ? "my-message-time" : "recipient-message-time"}>{formatToTime(message.createdAt)}</p>
                {/* { 
                    isMine && (
                        <span
                            style={{ color: message.isRead ? 'var(--white-color)' : 'var(--shadow-color)' }}
                            className="material-symbols-outlined message-result"
                        >
                            {message.isDelivered ? "done_all" : "check"}
                        </span>
                    )
                } */}
            </div>

            {showOptions && (
                <>
                    <div className={`message-options-popup ${isClosing ? 'closing' : 'showing'}`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleReply()}>Reply</button>
                        <button onClick={() => handleDeleteForMe()}>Delete for me</button>
                        {isMine && <button onClick={() => handleDeleteForEveryone()}>Delete for everyone</button>}
                    </div>
                </>
            )}
            </div>

            { showOptions && <div className={`message-options-backdrop`} onClick={(e) => {e.stopPropagation(); hideChatOptions()}} /> }
        </>
    );
});

export default Message;
