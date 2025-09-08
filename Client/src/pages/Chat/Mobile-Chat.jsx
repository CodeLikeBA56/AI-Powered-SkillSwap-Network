import './Chat.css';
import React, { useEffect } from 'react';
import ChatBox from '../../components/Chat-Module/Chat-Box/Chat-Box.jsx';
import GroupChatBox from '../../components/Chat-Module/Group-Chat-Box/GroupChatBox.jsx';
import ChatList from '../../components/Chat-Module/Chat-List/Chat-List.jsx';
import { useChat } from '../../context/ChatProvider.jsx';
import { useSettingContext } from '../../context/SettingContext.jsx';
import EmptyChatBox from '../../components/Chat-Module/Empty-Chat-Box/EmptyChatBox.jsx';

const MobileChat = () => {
  const { selectedChat, selectedGroupChat } = useChat();
  const { changeActiveLink } = useSettingContext();

  useEffect(() => {
    changeActiveLink('Chat');
  }, []);

  return (
    <div className='chat-screen'>
      <ChatList />
      { selectedChat && <ChatBox /> }
      { selectedGroupChat && <GroupChatBox /> }
      { !selectedChat && !selectedGroupChat && <EmptyChatBox />}
    </div>
  );
};

export default MobileChat;