const updateChats = (chats, chatId, updatedData) => {
    return chats.map(chat =>
        chat._id === chatId ? { ...chat, ...updatedData } : chat
    );
};
  
const pushMessage = (chatMessages, chatId, message) => {
  const dateKey = new Date(message.createdAt).toLocaleDateString('en-GB');

  const chatMessagesForChat = chatMessages[chatId] || {};
  const messagesForDate = chatMessagesForChat[dateKey] || [];

  return {
    ...chatMessages,
    [chatId]: {
      ...chatMessagesForChat,
      [dateKey]: [...messagesForDate, message],
    },
  };
};

const deleteMessageFromChat = (chatMessages, chatId, date, messageId) => {
  const updatedChats = { ...chatMessages };
  const messagesForDate = updatedChats[chatId]?.[date] || [];

  updatedChats[chatId][date] = messagesForDate.filter(msg => msg._id !== messageId);

  if (updatedChats[chatId][date].length === 0)
    delete updatedChats[chatId][date];

  if (Object.keys(updatedChats[chatId]).length === 0)
    delete updatedChats[chatId];

  return updatedChats;
};
  
const clearChatMessages = (chatMessages, chatId) => {
  const updated = { ...chatMessages };
  delete updated[chatId];
  return updated;
};
  
const updateLastMessage = (chats, chatId, lastMessageByMe) => {
  const updatedChats = chats.map(chat => {
    if (chat._id === chatId) {
      return { ...chat, lastMessage: lastMessageByMe, updatedAt: lastMessageByMe.createdAt };
    }
    return chat;
  });

  return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};


const updateLastMessageIfDeleted = (chats, chatId, messageId, lastMessageByMe) => {
  return chats.map(chat => {
    if (chat._id === chatId && chat.lastMessage?._id === messageId)
      return { ...chat, lastMessage: lastMessageByMe };
    return chat;
  });
};
  
const removeChat = (chats, chatId) => {
  return chats.filter(chat => chat._id !== chatId);
};

export { 
  updateChats, removeChat, updateLastMessage, 
  pushMessage, clearChatMessages, deleteMessageFromChat,
  updateLastMessageIfDeleted
};