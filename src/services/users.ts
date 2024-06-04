'use server'
import { PrismaClient } from "@prisma/client"

import { getSalt, hashPassword } from "../helpers/hashPassword";
import { cookies } from "next/headers";
import { signJWT, verifyJWT } from "@/helpers/jwt";
import { StyledString } from "next/dist/build/swc";
import { redirect } from "next/dist/server/api-utils";

const prisma = new PrismaClient()
let cantMadera = 500
let cantPan = 800
let cantPiedra= 600
let unidadesDeTrabajo = 100

export async function createUser(user: { email: string, password: string, username: string, profileImage: string}) {
  if (!user.email || user.email.length < 5 || !user.email.includes('@') ) {
    throw new Error('Invalid email');
  }
  if (!user.username || user.username.length < 3){
    throw new Error('Invalid username');
  }
  const existing = await prisma.users.findFirst({
    where: {
      email: user.email
    }
  })
  if (existing) {
    throw new Error('User already exists');
  }
  const existingUsername = await prisma.users.findFirst({
    where: {
      username: user.username
      }
  })
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  if (!user.password || user.password.length < 8) {
    throw new Error('Password too short');
  }

  const salt = getSalt();

  const  userWithHash = {
    username: user.username,
    email: user.email,
    hash: hashPassword(salt + user.password),
    profileImage: user.profileImage,
    piedra: cantPiedra,
    pan: cantPan,
    madera: cantMadera,
    nivel:1, 
    salt,
    unidadesDeTrabajo: unidadesDeTrabajo
}

  await prisma.users.create({ data: userWithHash });
}

export async function authenticateUser(user: { dataUser: string, password: string }) {

  let userTemp;
  let existing = await prisma.users.findFirst({
    where: {
      email: user.dataUser,
    } 
  })

  if(existing) userTemp = existing

  if(!existing){
    let existing2 = await prisma.users.findFirst({
      where: {
        username: user.dataUser
      }
    })
    if(existing2) userTemp = existing2
    if (!existing2 ) {
      throw new Error('User not found');
    }
  }
  
  const hash = hashPassword(userTemp?.salt + user.password);
  console.log(`hash nuevo: ${hash} - signJWT: ${signJWT(hash)}`)
  console.log(`hash existente: ${userTemp?.hash} - signJWT: ${signJWT(userTemp?.hash)}`)
  if (hash !== userTemp?.hash) {
    throw new Error('Invalid password');
  }
  
  cookies().set("user" , signJWT(hash) , { httpOnly: true, sameSite: 'strict' })

  return {userTemp};
}


export const getUserByUserName = async (userName:string) => {
  const users = await prisma.users.findFirst({
    where: {
      username: userName
    }
  })        
  return users
}
export const getUserByemail = async (email:string) => {
  const users = await prisma.users.findFirst({
    where: {
      email: email
    }
  })   
   return users
}
export const getUserByHash = async (hash?:string) => {
  const users = await prisma.users.findFirst({
    where: {
      hash: hash
    }
  }) 
  if(users)  return users
  /* else return false   */
}
export const getUserById= async (Id:string) => {
  const users = await prisma.users.findFirst({
    where: {
      id: Id
    }
  }) 
  return users
  /* else return false   */
}
export async function getUser(Id: string) {
  const u = await prisma.users.findUnique({
    where: {
      id: Id
    }
  })
  console.log(`User ${Id}: `, u)
  return u
}

//actualizo user
export async function updateUser(Id: string, data: any) {
  const u = await prisma.users.update({
    where: {
      id: Id
    },
    data: data
  })
  console.log(`User ${Id} updated: `, u)
  return u
}

//Devuelve el user en base a la cookie
export async function getUserByCooki() {
  //obtengo el valor de la cookie user
  const cooki = cookies().get('user')?.value
  //se obtiene el hash de traducir el token
  let hash = verifyJWT(String(cooki))
  //se obtiene el user por el hash
  const user = getUserByHash(String(hash))
  return user
}

