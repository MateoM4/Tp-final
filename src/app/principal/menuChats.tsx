"use client"
import React, { use } from 'react';
import { useEffect, useState } from 'react';
import { getUserByUserName, getUser } from '@/services/users';
import { createChat } from '@/services/chats';
import { get } from 'http';
interface MensajeriaProps {
  userId: string;
  mostrarMensajeria: boolean;
  userLoaded: boolean;
  chats: any[];
  chatnames: string[];
  handleMensajeria: () => void;
  getMensajes: (id: string) => void;
}

const Mensajeria: React.FC<MensajeriaProps> = ({ userId, mostrarMensajeria, userLoaded, chats, chatnames, handleMensajeria, getMensajes }) => {
  const [username, setUsername] = useState("");
  const [chats2, setChats] = useState<any[]>([]);

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleCreateChat = async (event: React.FormEvent) => {
    event.preventDefault();

    const currentUser = await getUser(userId);
    const selectedUser = await getUserByUserName(username);
    if (!selectedUser || !currentUser) {
      alert("User not found");
      return;
    }
    // create the chat
    const chat = await createChat(
      {
        user1: userId,
        user2: selectedUser.id,
        username1: currentUser.username,
        username2: selectedUser.username,
      }
    );

    // add the new chat to the list
    setChats(prevChats => [...prevChats, chat]);

    // clear the username field
    setUsername("");
  };
  if (!mostrarMensajeria || !userLoaded) {
    return null;
  }


  const handleRedirect = (chatid: string, userid: string) => {
    window.location.href = `/chat`
    console.log("chatid", chatid)
    localStorage.setItem('chatId', chatid)
    localStorage.setItem('userId', userid)
  }
  return (
    <div className="fixed inset-0 w-full h-full z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative w-1/2 h-1/2 bg-white rounded-lg">
        <button className="absolute top-2 right-2 text-lg font-bold" onClick={handleMensajeria}>X</button>
        <h1 className="text-1xl font-bold text-center">Mensajeria</h1>
        <form onSubmit={handleCreateChat} className="flex flex-col items-center mx-auto pb-4">
          <input type="text" value={username} onChange={handleUsernameChange} placeholder="Username" required className="text-center" />
          <button type="submit" className='bg-gray-200'>Create chat</button>
        </form>
        <div>
          <ul className='flex flex-col items-center'>
            {chats.map((chat: any, index: number) => (
              <li key={chat.id} className='flex flex-row justify-around items-center space-x-4'>
                <h2> ({chat.id}) Chat: {chatnames[index]}</h2>
                <button onClick={() => handleRedirect(chat.id, userId)} className='bg-gray-200'>abrir </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Mensajeria;