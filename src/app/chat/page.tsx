'use client'
import React from "react"
import { useEffect, useState } from "react";
import { createMensaje, getMensajes } from "@/services/mensajes";
import { getUser } from "@/services/users";

import { getChatNameById } from "@/services/chats";


import { get } from "http";

const Chats: React.FC = () => {

    const [mensajes, setMensajes] = useState<any[]>([])
    const [chatId, setChatId] = useState<string>("")
    const [username, setUsername] = useState<string>("")
    const [userId, setUserId] = useState<string>("")
    const [usernameOther, setUsernameOther] = useState<string>("")

    

    useEffect(() => {
        const chatLocalStorage = localStorage.getItem('chatId')
        const userIdLocalStorage = localStorage.getItem('userId')

        //conseguir chatId
        if (chatLocalStorage) {
            setChatId(chatLocalStorage as string)

            console.log("chatId", chatLocalStorage)
        }

        //conseguir userId
        if (userIdLocalStorage) {
            getUser(userIdLocalStorage as string).then(res => {
                if (res) {
                    setUserId(res.id)
                    setUsername(res.username)
                    console.log("username", res.username)
                }
            })
        }

        //conseguir mensajes
        if (chatId !== "") {
            getMensajes(chatId).then(res => {
                setMensajes(res)
            })
        }


        if(chatId !== "" && userId !== ""){
            getChatNameById(chatId, userId).then(setUsernameOther)
        }

    }, [chatId, userId])

    //refrescar por si me mandaron mensajes*/
    useEffect(() => {
        if (chatId !== "") {
            getMensajes(chatId).then(setMensajes);
        }
    
        const intervalId = setInterval(() => {
            if (chatId !== "") {
                getMensajes(chatId).then(setMensajes);
            }
        }, 5000);
        return () => clearInterval(intervalId);
    }, [chatId, userId]);

    const handleSubmit = async (event: any) => {
        event.preventDefault();

        // get form data
        const data = new FormData(event.target);

        // create the message object
        const mensaje = {
            chatId: chatId,   
            emisor: String(userId),   //soy yo
            emisorUserName: String(username),
            madera: Number(data.get("madera")),
            pan: Number(data.get("pan")),
            piedra: Number(data.get("piedra")),
            texto: data.get("mensaje") as string,
            fecha: new Date()
        }

        // create the message
        const m = await createMensaje(mensaje);
        console.log("El mensaje creado: ", m);
        setMensajes(prevMensajes => [...prevMensajes, m]);

        event.target.reset();
    }
    return (
        <main>
            <div className=" flex flex-col justify-center items-center mt-16 p-8  bg-gray-400">
                <div className=" justify-between bg-white w-8/12 flex   p-5 border m-5">

                    <h1>Chat: {usernameOther}</h1>

                    <h1>Chat: {username}</h1>

                </div>

                <div className=" bg-white p-10 m-2 w-8/12 flex-col flex justify-between">
                    <div className="p-5 flex flex-col font-bold text-sm bg-slate-300 overflow-auto max-h-[500px]">
                        {mensajes.map((mensaje, index) => (
                            <div key={index} className=" m-2" >
                                <span key={index} className=" text-slate-500 text-xs"> - {mensaje.emisorUserName} - {mensaje.fecha.toLocaleDateString()} -{mensaje.fecha.toLocaleTimeString()}</span>
                                <div className=" w-2/6 border p-3 rounded-sm border-white">
                                    <span key={index}>{mensaje.texto}</span>
                                </div>

                            </div>

                        ))}
                    </div>

                    <form className=" flex pt-5 flex-col" onSubmit={handleSubmit}>
                        <label htmlFor="mensaje">Mensaje</label>
                        <textarea className=" h-20 w-full resize-none" name="mensaje" placeholder="Límite de caractéres: 300"></textarea>

                        <h3 className="flex justify-center items-center">Desea donar algún recurso?</h3>
                        <div className=" border">
                            <div>
                                <label htmlFor="madera">Madera:</label>
                                <input id="madera" type="number" name="madera" />
                            </div>
                            <div>
                                <label htmlFor="piedra">Piedra</label>
                                <input id="piedra" type="number" name="piedra" />
                            </div>
                            <div>
                                <label htmlFor="pan">Pan</label>
                                <input id="pan" type="number" name="pan" />
                            </div>
                        </div>

                        <button type="submit" className=" mt-5 bg-blue-500 hover:bg-blue-700 " >Enviar</button>
                        {/*  <button  className=" mt-5 bg-blue-500 hover:bg-blue-700 ">Cancelar</button>                    */}
                    </form>
                    <a href="/principal" className="flex justify-center mt-5 bg-blue-400 hover:bg-blue-700 ">Principal</a>
                </div>
            </div>
        </main>
    )
}
export default Chats;