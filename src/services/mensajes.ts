'use server'
import { PrismaClient } from "@prisma/client"
import { create } from "domain"

const prisma = new PrismaClient()

// GET todos los mensajes de un chat
export const getMensajes = async (Id: string) => {
    const m = await prisma.mensajes.findMany({
        where: {
            chatId: Id
        }
    })
    console.log(`Chat ${Id} Mensajes: `, m)
    return m
}

// GET un solo mensaje de un chat
export const getMensaje = async (Id: string) => {
    const m = await prisma.mensajes.findFirst({
        where: {
            id: Id
        }
    })
    console.log(`Mensaje ${Id}: `, m)
    return m
}
// crear Mensaje
export const createMensaje = async (data: any) => {
    const m = await prisma.mensajes.create({
        data: data
    })
}