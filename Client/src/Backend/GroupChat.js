const updateGroupChatFavouriteStatus = (groupChats, chatId, userId, status) => {
    return groupChats.map(chat => {
        if (chat._id === chatId) {
            const updatedFavourite = { ...chat.isFavourite, [userId]: status };
            return { ...chat, isFavourite: updatedFavourite };
        }
        return chat;
    });
};

const updateGroupLastMessage = (chats, chatId, lastMessageByMe, seenBy) => {
    const updatedChats = chats.map(chat => {
      if (chat._id === chatId) {
        return { ...chat, seenBy, lastMessage: lastMessageByMe, updatedAt: lastMessageByMe.createdAt };
      }
      return chat;
    });
  
    return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const updateGroupMemberNickname = (chats, chatId, nicknames, updatedAt) => {
    const updatedChats = chats.map(chat => {
        if (chat._id === chatId)
          return { ...chat, nicknames, updatedAt };

        return chat;
    });

    return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export {
    updateGroupChatFavouriteStatus, updateGroupLastMessage, updateGroupMemberNickname
}