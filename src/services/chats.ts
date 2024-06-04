'use server'
import { PrismaClient } from "@prisma/client"
import { getUser } from "./users"

const prisma = new PrismaClient()

// GET todos los chats de un usuario
export const getChats = async (Id: string) => {
    const c = await prisma.chats.findMany({
        where: {
            OR: [
                {
                    user1: Id
                },
                {
                    user2: Id
                }
            ]
        }
    })
    console.log(`User ${Id} Chats: `, c)
    return c
}

export const getChat = async (Id: string) => {
    const c = await prisma.chats.findFirst({
        where: {
            id: Id
        }
    })
    console.log(`Chat ${Id}: `, c)
    return c
}
// para crear un nuevo chat
export const createChat = async (data: any) => {
    const c = await prisma.chats.create({
        data: data
    })
    console.log(`Chat created: `, c)
    return c
}

//para actualizar un chat, si se manda un mensaje, etc.
export const updateChat = async (Id: string, data: any) => {
    const c = await prisma.chats.update({
        where: {
            id: Id
        },
        data: data
    })
    console.log(`Chat ${Id} updated: `, c)
    return c
}   

export const getUsernameOther = async (chatId: string, userId: string) =>{
    let user = null
    const chat = await getChat(chatId)
    if(chat){
        if(chat.user1 === userId){
            user = await getUser(chat.user2)
            console.log("------------>", user?.username)
            return String(user?.username || "")
        }else{
            user = await getUser(chat.user1)
            console.log("------------>", user?.username)
            return String(user?.username || "")
        }
    }
    else return ""
     
}
// para conseguir el nombre de los chats
export const getChatName = (chat: any, userId: string) =>{
    if(chat && userId){
        //devuelven el nombre del otro usuario del chat
        if(chat.user1 === userId){
            return String(chat.username2 || "UNKNOWN")
        }else{
            return String(chat.username1 || "UNKNOWN")
        }
    }
    else return "UNKNOWN"
}
