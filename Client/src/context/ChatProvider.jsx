import axiosInstance from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./SocketProvider.jsx";
import { useAlertContext } from "./AlertContext.jsx";
import { useUserProfile } from "./UserProfileProvider.jsx";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { pushMessage, deleteMessageFromChat, clearChatMessages,
  updateLastMessage, removeChat, updateLastMessageIfDeleted
} from "../Backend/Chat.js";
import { updateGroupChatFavouriteStatus, updateGroupLastMessage, updateGroupMemberNickname } from "../Backend/GroupChat.js";


const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { userInfo } = useUserProfile();
  const { showAlert } = useAlertContext();

  // Will be used to save the selected users for intiating chat or group chat.
  const [selectedUsers, setSelectedUsers] = useState([]);
  // Will be used to show the modal for selecting users for the chat or group chat.
  const [showSearchUserModel, setShowSearchUserModel] = useState(false);
  const [showCreateGroupChatForm, setShowCreateGroupChatForm] = useState(false);
  
  const handleCloseModal = async () => setShowSearchUserModel(false);

  const [chats, setChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [groupChatMessages, setGroupChatMessages] = useState({});
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
    
  const fetchUserChats = async () => {
    try {
      const response = await axiosInstance.get(`api/chat/`);
      const { chats } = response.data;
      setChats(chats);
    } catch(error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const fetchUserGroupChats = async () => {
    try {
      const response = await axiosInstance.get(`api/group-chat/`);
      const { groupChats } = response.data;
      setGroupChats(groupChats);
    } catch(error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const fetchMessagesByChat = async (chatId) => {
    try {
      const response = await axiosInstance.get(`api/chat-messages/get-messages-by-chat/${chatId}`);
      const { chat: groupedMessages } = response.data;
      setChatMessages(prev => ({ ...prev, [chatId]: groupedMessages }));
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const fetchAllChatsAndMessages = async () => {
    try {
      const response = await axiosInstance.get(`api/chat-messages/get-all-chats-and-messages`);
      const { userChats: chats, userChatMessages: messages } = response.data;
      setChats(chats || []);
      setChatMessages(messages);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const fetchAllGroupChatsAndMessages = async () => {
    try {
      const response = await axiosInstance.get(`api/group-chat-messages/get-all-group-chats-and-messages`);
      const { userGroupChats, messages } = response.data;
      setGroupChats(userGroupChats);
      setGroupChatMessages(messages);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  useEffect(() => {
    if (userInfo && chats?.length === 0 && chatMessages && Object.keys(chatMessages)?.length === 0) {
      fetchAllChatsAndMessages();
      fetchAllGroupChatsAndMessages();
    }

    if (userInfo === null) {
      setChats([]);
      setGroupChats([]);
      setChatMessages({});
      setGroupChatMessages({});
      setSelectedChat(null);
      setSelectedGroupChat(null);
      setSelectedUsers([]);
      setShowSearchUserModel(false);
      setShowCreateGroupChatForm(false);
    }
  }, [userInfo]);

  const getExistingChat = (participantId) => {
    return chats?.find(chat => chat?.participants?._id === participantId);
  };  

  const initiateChat = async (participant_id, participant_nickname, participant_profilePicture) => {
    try {
      let isChatExisted = getExistingChat(participant_id);
      if (!isChatExisted)
        isChatExisted = await createChat(participant_id, participant_nickname, participant_profilePicture);

      await fetchMessagesByChat(isChatExisted._id);
      isChatExisted.seenBy = { ...isChatExisted.seenBy, [userInfo?._Id]: true };
      setSelectedGroupChat(null);
      setSelectedChat(isChatExisted);
      navigate("/dashboard/chat");
    } catch(error) {
      console.error(error);
    }
  }

  const createChat = async (participant_id, participant_nickname, participant_profilePicture) => {
    try {
      const isChatExisted = getExistingChat(participant_id);
      if (isChatExisted?._id) {
        return isChatExisted;
      }

      const participant = {
        _id: participant_id,
        username: participant_nickname,
        profilePicture: participant_profilePicture,
      };

      const response = await axiosInstance.post(`api/chat/`, { my_nickname: userInfo.username, participant_id, participant_nickname });
      const { chat } = response.data;
      chat.participants = participant;
      setChats(pre => [chat, ...pre]);
      return chat;
    } catch(error) {
      console.error(error);
    }
  }

  const switchChat = async (chatId) => {
    if (selectedGroupChat)
      setSelectedGroupChat(null);
    const updatedChats = chats.map(c => c._id === chatId? {...c, seenBy: {...c.seenBy, [userInfo._id] : true}} : c);
    setChats(updatedChats);
    setSelectedChat(updatedChats.find(c => c._id === chatId));
  }

  const switchGroupChat = async (groupChatId) => {
    if (selectedChat)
      setSelectedChat(null);
    const updatedGroupChats = groupChats.map(c => c._id === groupChatId? {...c, seenBy: {...c.seenBy, [userInfo._id] : true}} : c);
    setGroupChats(updatedGroupChats);
    setSelectedGroupChat(updatedGroupChats.find(c => c._id === groupChatId));
  }

  const sendMessage = async (chatId, messageObj, participant, replyTo = {}, post = null, session = null) => {
    try {
      const lastestMessageByMe = { 
        post, session, content: messageObj.content, 
        attachments: messageObj.attachments, createdAt: messageObj.createdAt, 
      };

      const response = await axiosInstance.post('api/chat-messages/send-message', { ...messageObj, participant });
      const { message } = response.data;

      lastestMessageByMe._id = message?._id;
      message.sender = { _id: userInfo._id, username: userInfo.username };
      
      if (message.post)
        message.post = post;
    
      if (message.session)
        message.session = session;
    
      if (Object.keys(replyTo).length)
        message.replyTo = replyTo;

      setChatMessages(prev => pushMessage(prev, chatId, message));
      setChats(prev => updateLastMessage(prev, chatId, lastestMessageByMe));

      socket.emit('notify-participant', {to: participant, chatId, message, lastMessage: lastestMessageByMe});
    } catch (error) {
      const { type, message } = error.response?.data;
      showAlert(type, message);
    }
  }

  const updateChatName = async (chatId, participant, nickname) => {
    setChats(prev => prev.map(chat => {
      if (chat._id === chatId) {
        const updatedNicknames = chat.nicknames;
        updatedNicknames[participant] = nickname;
        return {...chat, nicknames: updatedNicknames};
      } else
        return chat
    }))
  }

  const clearChat = async (chatId, participant) => {
    try {
      const response = await axiosInstance.patch(`api/chat/clear-chat/${chatId}`, { participant });
      if (response.status === 200) {
        const { type, message } = response.data;
        setChatMessages(prev => clearChatMessages(prev, chatId));
        setChats(prev => prev.map(c => c._id === chatId? {...c, lastMessage: null} : c) );
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const deleteMessageForMe = async (chatId, date, messageId) => {
    try { // 1. Update client side
      const response = await axiosInstance.put(`api/chat-messages/delete-message-for-me/${messageId}`);
      if (response.status === 200) {
        const { type, message, lastMessageByMe } = response.data;
        showAlert(type, message);
        setChatMessages(prev => deleteMessageFromChat(prev, chatId, date, messageId));
        setChats(prev => updateLastMessage(prev, chatId, messageId, lastMessageByMe));
      }
    } catch (error) {
      const { type, message } = error.response?.data;
      showAlert(type, message);
    }
  };

  const deleteMessageForEveryone = async (chatId, date, messageId) => {
    try {
      const participant = chats.find(c => c._id === chatId).participants._id;

      const response = await axiosInstance.delete(`api/chat-messages/delete-message-for-everyone/${messageId}`);
      if (response.status === 200) {
        const { lastMessageByMe, lastMessageByOther } = response.data;
        setChatMessages(prev => deleteMessageFromChat(prev, chatId, date, messageId));
        setChats(prev => updateLastMessageIfDeleted(prev, chatId, messageId, lastMessageByMe));

        socket.emit('notify-chat-message-deleted', {to: participant, chatId, date, messageId, lastMessage: lastMessageByOther});
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };  

  const deleteChat = async (chatId, participantId) => {
    const chatElement = document.getElementById(`chat-${chatId}`);
    if (chatElement) chatElement.classList.add('deleting');
    
    try {
      const response = await axiosInstance.delete('api/chat/', { data: {chatId, participant: participantId} });
      
      if (response.status === 200) {
        setTimeout(() => {
          const { type, message } = response.data;
          showAlert(type, message);
          
          setSelectedChat(prev => prev?._id === chatId? null : prev);
          setChatMessages(prev => clearChatMessages(prev, chatId));
          setChats(prev => removeChat(prev, chatId));
        }, 1000);
      }
    } catch (error) { // Revert state if error occurs
      setTimeout(() => {
        if (chatElement) chatElement.classList.remove('deleting');
        const { type, message } = error.response?.data;
        showAlert(type, message);
      }, 1200);
    }
  };  

  const initiateGroupChat = async (groupData) => {
    try {
      const admin = userInfo._id;
      groupData.admin = admin;
      groupData.participants = selectedUsers.map(u => u._id);
      groupData.participants.push(admin);
  
      const lastMessage = {};
      const nicknames = {};
      const deleteBy = {};
      const seenBy = {};
  
      nicknames[admin] = userInfo.username;
      lastMessage[admin] = null;
      deleteBy[admin] = false;
      seenBy[admin] = false;

      selectedUsers.forEach(participant => {
        nicknames[participant._id] = participant.username;
        lastMessage[participant._id] = null;
        deleteBy[participant._id] = false;
        seenBy[participant._id] = false;
      });
  
      groupData.lastMessage = lastMessage;
      groupData.nicknames = nicknames;
      groupData.deleteBy = deleteBy;
      groupData.seenBy = seenBy;
  
      const response = await axiosInstance.post('api/group-chat/', groupData);
      if (200 === response.status) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response?.data || { type: 'error', message: 'Something went wrong while creating group.' };
      showAlert(type, message);
    }
  };

  const sendGroupMessage = async (chatId, messageObj, replyTo) => {
    try {
      const senderId = userInfo?._id;
      
      const response = await axiosInstance.post('api/group-chat-messages/send-message', messageObj);
      const { message, seenBy } = response.data;
      const lastestMessageByMe = { 
        _id: message._id, 
        content: message.content,
        createdAt: message.createdAt,
        attachments: message.attachments,
      };

      message.type = 'message';
      message.sender = { _id: senderId, username: userInfo?.username };
      if (Object.keys(replyTo).length)
        message.replyTo = replyTo;
  
      setGroupChatMessages(prev => pushMessage(prev, chatId, message));
      setGroupChats(prev => updateGroupLastMessage(prev, chatId, lastestMessageByMe, seenBy));
  
      const receivers = messageObj.participants.filter(id => id !== senderId);
      socket.emit('notify-group-participants', {
        to: receivers, chatId, message, lastMessage: lastestMessageByMe, seenBy
      });
    } catch (error) {
      const { type, message } = error.response?.data;
      showAlert(type, message);
    }
  };

  const addGroupChatToFavourites = async (chatId) => {
    try {
      const response = await axiosInstance.patch(`api/group-chat/add-group-chat-to-favourites/${chatId}`);
      const { type, message } = response.data;
      showAlert(type, message);
      setGroupChats(prev => updateGroupChatFavouriteStatus(prev, chatId, userInfo?._id, true));
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const removeGroupChatFromFavourites = async (chatId) => {
    try {
      const response = await axiosInstance.patch(`api/group-chat/remove-group-chat-from-favourites/${chatId}`);
      const { type, message } = response.data;
      showAlert(type, message);
      setGroupChats(prev => updateGroupChatFavouriteStatus(prev, chatId, userInfo?._id, false));
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };  

  const hanldeUpdateGroupMemberNickname = async (payload) => {
    try {
      const response = await axiosInstance.patch(`api/group-chat/update-group-member-nickname`, payload);
      const { type, message } = response.data;
      showAlert(type, message);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await axiosInstance.put(`api/group-chat/join-group/${groupId}`);

      if (200 === response.status) {
        const { type, message, group } = response.data;
        setGroupChats(prev => [group, ...(prev || [])]);
        fetchAllGroupChatsAndMessages();
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const handleLeaveGroup = async (groupId) => {
    try {
      const response = await axiosInstance.put(`api/group-chat/leave-group/${groupId}`);

      if (200 === response.status) {
        const { type, message } = response.data;
        setGroupChats(prev => prev.filter(group => group._id !== groupId));
        showAlert(type, message);
        setSelectedGroupChat(prev => prev?._id === groupId ? null : prev);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const handleAddMemberToGroup = async (groupId, member) => {
    try {
      const body = { groupId, userIdToAdd: member._id, participantName: member.username }
      const response = await axiosInstance.put(`api/group-chat/add-member-to-group`, body);

      if (200 === response.status) {
        const { group, messageEvent } = response.data;
        setSelectedGroupChat(prev => prev._id === group._id ? group : prev);
        setGroupChats(prev => prev.map(g => g._id === group._id ? group : g));
        handleReceiveGroupChatMessageEvent({ groupId, messageEvent, nicknames: group.nicknames, updatedAt: group.updatedAt });
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const handleRemoveMemberFromGroup = async (groupId, memberId) => {
    try {
      const response = await axiosInstance.patch(`api/group-chat/remove-member-from-group`, { groupId, memberId });

      if (200 === response.status) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      const response = await axiosInstance.delete(`api/group-chat/${groupId}`);
      if (200 === response.status) {
        const { type, message } = response.data;
        await handleDeleteGroup({ groupId });
        showAlert(type, message);
      }
    } catch (error) {
      
    }
  }

  const handleReceiveChatMessage = useCallback(async ({ chatId, message, lastMessage }) => {
    setChatMessages(prev => pushMessage(prev, chatId, message));
    setChats(prev => updateLastMessage(prev, chatId, lastMessage));
  }, [socket]);
  
  const handleReceiveGroupChatMessage = useCallback(async ({ chatId, message, lastMessage, seenBy }) => {
    setGroupChatMessages(prev => pushMessage(prev, chatId, message));
    setGroupChats(prev => updateGroupLastMessage(prev, chatId, lastMessage, seenBy));
  }, [socket]);

  const handleReceiveGroupChatMessageEvent = useCallback(async ({ groupId, messageEvent, nicknames, updatedAt }) => {
    setGroupChatMessages(prev => pushMessage(prev, groupId, messageEvent));
    setGroupChats(prev => updateGroupMemberNickname(prev, groupId, nicknames, updatedAt));
    setSelectedGroupChat(prev => prev?._id === groupId ? { ...prev, nicknames } : prev);
  }, [socket]);

  const handleDeleteChatMessage = useCallback(async ({ chatId, date, messageId, lastMessage }) => {
    setChatMessages(prev => deleteMessageFromChat(prev, chatId, date, messageId));
    setChats(prev => updateLastMessageIfDeleted(prev, chatId, messageId, lastMessage));
  }, [socket]);

  const handleAddParticipantToGroup = useCallback(async ({ groupId, newMember }) => {
    setGroupChats(prev => {
      const updated = prev.map(group => {
        if(group._id === groupId) {
          const updatedNicknames = { ...group.nicknames, [newMember._id]: newMember.username };
          const updatedParticipants = [...group.participants, newMember];
          return { ...group, participants: updatedParticipants, nicknames: updatedNicknames };
        } 
        
        return group;
      })

      const updatedGroup = updated.find(group => group._id === groupId);
      if (selectedGroupChat?._id == groupId)
        setSelectedGroupChat(updatedGroup);
    
      return updated;
    });
  }, [socket, selectedGroupChat]);

  const handleRemoveParticipantFromGroup = useCallback(async ({ groupId, memberId }) => {
    setGroupChats(prev => {
      const updated = prev.map(group => {
        if (group._id === groupId) {
          const updatedParticipants = group.participants.filter(member => member._id !== memberId);
          return { ...group, participants: updatedParticipants };
        }
        return group;
      });

      const updatedGroup = updated.find(group => group._id === groupId);
      if (selectedGroupChat?._id === groupId)
        setSelectedGroupChat(updatedGroup);
    
      return updated;
    });    
  }, [socket, selectedGroupChat]);

  const handleAcceptJoinGroupRequest = useCallback(async ({ newJoinedGroup }) => {
    await fetchAllGroupChatsAndMessages();
  }, [fetchAllGroupChatsAndMessages]);

  const handleDeleteGroup = useCallback(async ({ groupId }) => {
    setGroupChats(prev => prev.filter(chat => chat._id !== groupId));
    setGroupChatMessages(prev => {
      const updatedMessages = { ...prev };
      delete updatedMessages[groupId];

      return updatedMessages;
    });
    setSelectedGroupChat(prev => prev?._id === groupId ? null : prev);
  }, [groupChats, groupChatMessages]);

  useEffect(() => {
    // chats sockets
    socket.on('chat-message-received', handleReceiveChatMessage);
    socket.on('chat-message-deleted-for-everyone', handleDeleteChatMessage);
    
    // Group chats sockets
    socket.on('delete-group', handleDeleteGroup);
    socket.on('add-member-to-group', handleAddParticipantToGroup);
    socket.on('remove-member-from-group', handleRemoveParticipantFromGroup);
    socket.on('group-chat-message-received', handleReceiveGroupChatMessage);
    socket.on('someone-added-you-in-a-group', handleAcceptJoinGroupRequest);
    socket.on('group-chat-message-event-received', handleReceiveGroupChatMessageEvent);
    
    return () => {
      socket.off('delete-group', handleDeleteGroup);
      socket.off('chat-message-received', handleReceiveChatMessage);
      socket.off('add-member-to-group', handleAddParticipantToGroup);
      socket.off('remove-member-from-group', handleRemoveParticipantFromGroup);
      socket.off('group-chat-message-received', handleReceiveGroupChatMessage);
      socket.off('chat-message-deleted-for-everyone', handleDeleteChatMessage);
      socket.off('someone-added-you-in-a-group', handleAcceptJoinGroupRequest);
      socket.off('group-chat-message-event-received', handleReceiveGroupChatMessageEvent);
    }
  }, 
    [
      socket, handleReceiveChatMessage, handleAddParticipantToGroup, handleRemoveParticipantFromGroup,
      handleDeleteChatMessage, handleReceiveGroupChatMessage, handleReceiveGroupChatMessageEvent,
      handleAcceptJoinGroupRequest
    ]
  );

  return (
    <ChatContext.Provider value={{ 
      selectedUsers, setSelectedUsers,
      showCreateGroupChatForm, setShowCreateGroupChatForm,
      showSearchUserModel, setShowSearchUserModel, handleCloseModal,

      chats, selectedChat, initiateChat, createChat, switchChat, updateChatName,
      sendMessage, chatMessages, deleteChat, clearChat,
      deleteMessageForMe, deleteMessageForEveryone,

      groupChats, selectedGroupChat, initiateGroupChat, switchGroupChat,
      sendGroupMessage, groupChatMessages, handleJoinGroup, handleLeaveGroup, 
      handleAddMemberToGroup, handleRemoveMemberFromGroup, deleteGroup,

      addGroupChatToFavourites, removeGroupChatFromFavourites, hanldeUpdateGroupMemberNickname, 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
export default ChatProvider;