'use server'
import { PrismaClient } from "@prisma/client"

import { getSalt, hashPassword } from "../helpers/hashPassword";
import { cookies } from "next/headers";
import { signJWT, verifyJWT } from "@/helpers/jwt";
import { StyledString } from "next/dist/build/swc";
import { redirect } from "next/dist/server/api-utils";
import { error } from "console";

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
    unidadesDeTrabajo: unidadesDeTrabajo,
        // otros campos que necesites----------------------------------------------------------------------
    //--------------------------------------------------------------------------------
    //----------------------------------------------------------------
    //canon : 0,
    muros : 0,
    bosque : 0,
    herreria : 0,
    cantera : 0,
    maderera :0,
    panaderia : 0,
    ayuntamiento : 0

    //---------------------------------------------
//-----------------------------esto---------------------------------------------------------------

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
//actualizo recursos de user
export async function updateUserRecursos(Id: string, madera: number, piedra: number, pan:number) {
  const u = await getUserById(Id)
  if((Number(u?.madera) < madera) || (Number(u?.piedra) < piedra) 
    || (Number(u?.pan) < pan)) { 
      throw error("Insuficientes recursos")
    }
  let maderaUpdated = Number(u?.madera) - madera
  let piedraUpdated = Number(u?.piedra) - piedra
  let panUpdated = Number(u?.pan) - pan

  const userUpdated = await prisma.users.update({
    where: {
      id: Id
    },
    data: {
      madera: maderaUpdated,
      piedra:piedraUpdated,
      pan:panUpdated
    }
  })

  console.log(`User ${Id} updated: `, userUpdated)
  return userUpdated
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



//-----------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
//----------------------------------------------------SEBA---para abajo nuevo -------------------------------------------------

// GUARDA EL EDIFICIO EN LA BASE DE DATOS CUANDO SE MUEVE
export async function GuardarEdificio(id: string, posX: number, posY: number, edificioNivel: number): Promise<void> {
  try {
    // Lógica para guardar/actualizar el edificio en la base de datos
    await prisma.userEdificios.updateMany({
      where: { id },
      data: {
      
        posicion_x: posX,
        posicion_y: posY,
        nivel : edificioNivel
       
      },
     
    });
  } catch (error) {
    console.error("Error saving building:", error);
    throw error;
  }
  console.log("id ", id)
  console.log(" posx", posX)
  console.log(posY)

}

// metodo para construir un edificio
export async function builtEdificio(usuarioId: string,edificioID: string, edificioX: number,edificioY: number, edificioNivel: number) {
  try {
      // Obtener el ID del usuario
      //const usuarioId = '6645239328fab0b97120439e';
     
      // Crear el edificio en la base de datos utilizando Prisma
      const nuevoEdificio = await prisma.userEdificios.create({
          data: {
              edificioId: edificioID, // Asegúrate de que este es un string válido
              posicion_x: edificioX,
              posicion_y: edificioY,
              userId: usuarioId,
              ultimaInteraccion: new Date(),
              nivel: edificioNivel // Establecer un valor por defecto para 'nivel'
              
          }
      });

      // Devolver el ID del usuario y el edificio creado
      return { usuarioId: usuarioId, edificio: nuevoEdificio };
  } catch (error) {
      console.error("Error al guardar el edificio en la base de datos:", error);
      throw error; // Relanzar el error para que sea manejado por el código que llama a esta función
  }
}

// metodo para obtener los edificios de un usuario


export async function updateUserBuildings(
  userId: string,
  muro: number,
  bosque: number,
  herreria: number,
  cantera: number,
  maderera: number,
  panaderia: number,
  ayuntamientos: number,
  pans : number,
  maderas : number,
  piedras : number

) {
  try {
    // Buscar al usuario
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      // Actualizar los campos de edificios con las cantidades proporcionadas
      await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          // Actualizar los campos de edificios con las cantidades proporcionadas
          bosque: bosque,
          herreria: herreria,
          cantera: cantera,
          maderera: maderera,
          panaderia: panaderia,
          ayuntamiento: ayuntamientos,
          pan: pans,
          madera: maderas,
          piedra: piedras,
          muros: muro,
        },
      });
      console.log('User buildings updated successfully.');
    } else {
      console.log(`User with ID ${userId} not found.`);
    }
  } catch (error) {
    console.error('Error updating user buildings:', error);
    throw error;
  }
};


export async function getChatIdByCooki(){
  const chatId = cookies().get('chatId')?.value
  return chatId
}

export async function getOtherUsers(userId: string){
  const users = await prisma.users.findMany({
    where: {
      NOT: {
        id: userId
      }
    }
  })
  return users
}


