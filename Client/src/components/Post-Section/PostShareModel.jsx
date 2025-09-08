import './PostShareModel.css';
import axiosInstance from '../../api/axios';
import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatProvider.jsx';
import { useAlertContext } from '../../context/AlertContext.jsx';
import { updatePostShareWithCount } from '../../Backend/Post.js';
import { useUserProfile } from '../../context/UserProfileProvider';
import RoundUserTag from '../Profile-Module/Round-User-Tag/RoundUserTag';

const PostShareModel = ({ postId, propertyName = 'post', closePostShareModel, post = null, session = null }) => {
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();
    const { sendMessage, createChat } = useChat();
    const [sharePostWith, setSharePostWith] = useState([]);

    const [content, setContent] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedUserByName, setSearchedUserByName] = useState([]);

    const handleSharePostWith = (user) => {
        if (sharePostWith.some(u => u._id === user._id))
            setSharePostWith(prev => prev.filter(u => u._id !== user._id));
        else
            setSharePostWith(prev => [...prev, user]);
    }

    useEffect(() => {
        const controller = new AbortController();
        const delayDebounce = setTimeout(() => {
          if (searchQuery.trim() === "") {
            setSearchedUserByName([]);
            return;
          }

          axiosInstance.get(`/api/recommendations/fetch-users-by-name-or-email/${searchQuery}`, {
            signal: controller.signal,
          }).then((res) => {
              if (res.data?.users)
                setSearchedUserByName(res.data.users);
          }).catch((err) => {
              if (err.name !== 'CanceledError') {
                console.error('Search failed:', err.message);
              }
          });
        }, 600); // 600ms debounce delay
      
        return () => { // Cleanup: abort previous call and clear timeout
          controller.abort();
          clearTimeout(delayDebounce);
        };
    }, [searchQuery]);

    const handleSendMessage = async () => {
        try {
            sharePostWith.forEach(async user => {
                const chat = await createChat(user._id, user.username, user.profilePicture);
                const chatId = chat._id;
                const participant = chat.participants._id;
                
                const messageObj = { 
                    chat: chatId,
                    sender: userInfo?._id,
                    content,
                    [propertyName]: postId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                sendMessage(chatId, messageObj, participant, {}, post, session);
            });
    
            const response = await axiosInstance.patch(`api/${propertyName}/update-shared-by/${postId}`);
            if (response.status === 200) {
                setSharePostWith([]);
                closePostShareModel();
            }
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    };

    return (
        <div className='post-share-section'>
            <input 
                type='search' 
                placeholder='Search' 
                className='searchbar'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className='user-list'>
                {
                    0 === searchedUserByName.length && userInfo?.following?.map(f => {
                        return (
                            <RoundUserTag
                                key={f._id}
                                user={f}
                                handleSharePostWith={handleSharePostWith}
                                isSelected={sharePostWith.some(u => u._id === f._id)}
                            />
                        );
                    })
                }
                {
                    0 !== searchedUserByName.length && searchedUserByName?.map(f => {
                        return (
                            <RoundUserTag
                                key={f._id}
                                user={f}
                                handleSharePostWith={handleSharePostWith}
                                isSelected={sharePostWith.includes(f._id)}
                            />
                        );
                    })
                }
            </div>

            { 0 !== sharePostWith.length && (
                <input 
                    type='text'
                    placeholder='Write a message'
                    className='share-post-input'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            )}
            <button 
                type='button' className='share-post-btn'
                style={{
                    marginTop: sharePostWith.length ? '0' : 'auto',
                    background: sharePostWith.length ? 'var(--main-color)' : 'var(--secondary-color)'
                }}
                disabled={0 === sharePostWith.length} 
                onClick={handleSendMessage}
            >Send ({sharePostWith.length})</button>
        </div>
    )
};

export default PostShareModel;