'use client'
import React, { useState, useEffect, useRef, use } from 'react';
import MenuDesplegable from './menuDesplegable';
import MenuAsignar from './menuAsignar';
import Mensajeria from './menuChats';
import { GuardarEdificio, getBuildingsByUserId, builtEdificio, getUEbyUserId, getUEById } from '../../services/userEdificios';
import { getUserByCooki, getUser, getUserByHash} from '@/services/users';
import {recolectarRecursos } from '@/services/recursos';
import { getChats, getUsernameOther, getChatName } from '@/services/chats';
import { getMensajes } from '@/services/mensajes';
//-
import { updateUserBuildings } from '@/services/users';

type Building = {
  x: number;
  y: number;
  type: string;
  ancho: number;
  largo: number;
  id: string;
  nivel: number;
  costo: number;
};
type datos = {
  edifId: string,
  userId: string
}
const DynamicBuildings: React.FC = () => {

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draggedBuildingIndex, setDraggedBuildingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [madera, setMadera] = useState(0);
  const [piedra, setPiedra] = useState(0);
  const [pan, setPan] = useState(0);
  const[unidadesDisponibles, setUnidadesDisp] = useState(0)
  const [usuario, setUser] = useState('');
  const [userId, setUserId] = useState('')
  //cuando se cliclea un botón se habilita 
  const[menuButton, setMenBut] = useState(false);
  const[menuButton2, setMenBut2] = useState("");

  ////-----------------------------------------------------------
//---------------------seba--------------------------------------
//-----------------------------------------------------------
const [canon, setCanon] = useState(0);
const [maderera, setMaderera] = useState(0);
const [cantera, setCantera] = useState(0);
const [panaderia, setPanaderia] = useState(0);
const [bosque, setBosque] = useState(0);
const [muros, setMuros] = useState(0);
const [ayuntamiento, setAyuntamiento] = useState(0);
const [herreria, setHerreria] = useState(0);
//const [UserId, setUserId] = useState('');
const [message, setMessage] = useState('');
//-----------------------------------------------------------
//-----------------------------------------------------------

  // para la mensajeria
  const [userLoaded, setUserLoaded] = useState(false);
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatnames, setChatNames] = useState<string[]>([]);


  //este método obtiene el dato recibido del hijo menuAsignar, el cual será usado para setear cerrar el botón
  const recibirDatosDelHijo = (datos: any) => {
    console.log("datos222", datos)
     setMenBut(!menuButton);
  };



  const mouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const mouseUpRef = useRef<() => void>(() => {});
  
  //#region USEEFFECTS USUARIO
  //useffect para obetener el id de user 
  useEffect(() => {
    const fetchUserAndBuildings = async () => {
      try {
        // Fetch the user ID
        const user = await getUserByCooki();
        const userId = user?.id;

        if (userId) {
          const userIdString = userId.toString();
          setUser(userIdString);

          // Fetch buildings by user ID
          const fetchedBuildings = await getBuildingsByUserId(userIdString);
          setBuildings(fetchedBuildings);
        } else {
          console.error("User ID is undefined");
        }
      } catch (error) {
        console.error("Error fetching buildings:", error);
      }
    };

    fetchUserAndBuildings();

    // Load user data (assuming this is a synchronous function)
    cargarUser();
  }, []);
//------------------------
//-------------------------------------------

useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(''), 10000);
    return () => clearTimeout(timer);
  }
}, [message]);

const messageDivStyle = {
  display: message ? 'block' : 'none', // Mostrar el mensaje solo cuando hay un mensaje para mostrar
};


//----------------
//----------------
//----------------


//conseguir todos los nombres de los chats

  //---------------------------------------------------
  //---------------------------------------------------
  //---------------------------------------------------

const handleBuildClick = async (id: string, x: number, y: number, buildingType: string, ancho: number, largo: number, costos: number) => {
  const existingBuilding = false //buildings.find(building => building.x === x && building.y === y && building.id === id);
    
   if (!existingBuilding) {
     

     // Actualizar el estado del usuario
     const construir = await updateBuildingCount(id, costos); // devuelve 1 si se puede construir, 0 si no
      // window.location.reload();
     // Llamar a la función para guardar el edificio en la base de datos
     if (construir === 1) {
       buildings.find(building => building.x === x && building.y === y && building.id === id);
       
       const newBuilding = { id, x, y, type: buildingType, ancho, largo, cantidad: 1 };
       //setBuildings([...buildings, newBuilding]);
       window.location.reload();
       try {
         // Evita recargar la página, en su lugar actualiza el estado
         await builtEdificio(userId, id, x, y, 1);
         console.log('Edificio guardado exitosamente en la base de datos.');
        
       } catch (error) {
         console.error('Error al guardar el edificio en la base de datos:', error);
       }
     }
   } else {
     console.log('Ya hay un edificio del mismo tipo en estas coordenadas');
   }
 }; 
 
 //------------------------------------------------------------
 //----------------------------------
  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };
  

  const handleMouseDown = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    setDraggedBuildingIndex(index);
    const startX = event.clientX;
    const startY = event.clientY;
    setDragOffset({ x: startX - buildings[index].x, y: startY - buildings[index].y });

    mouseMoveRef.current = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      handleBuildingMove(index, newX, newY);
    };

    mouseUpRef.current = () => {
      setDraggedBuildingIndex(null);
      window.removeEventListener('mousemove', mouseMoveRef.current);
      window.removeEventListener('mouseup', mouseUpRef.current);
    };

    window.addEventListener('mousemove', mouseMoveRef.current);
    window.addEventListener('mouseup', mouseUpRef.current);

  };

  

  const getCollidedBuildingIndex = (index: number, x: number, y: number, width: number, height: number) => {
    return buildings.findIndex((building, i) =>
      i !== index &&
      x < building.x + building.ancho &&
      x + width > building.x &&
      y < building.y + building.largo &&
      y + height > building.y
    );
  };



 
  const recolectarRecursosUser = async () => {
/*     "use server" */
    const user = await getUserByCooki()
    if(user != null){
      await recolectarRecursos(user.id);
      setMadera(user.madera);
      setPiedra(user.piedra);
      setPan(user.pan);
    }
  }
  const cargarUser = async () => {
    const user = await getUserByCooki()
/* const user = await getUser(usoCooki().then(x =>x?.id)) */
    if(user != null){
      setMadera(user.madera);
      setPiedra(user.piedra);
      setPan(user.pan);
      setUser(String (user.username));
      setUnidadesDisp(user.unidadesDeTrabajo)
      //--------------------------
      //----------------------
      //----------------------
      setUserId(user.id);
      setMaderera(user.maderera);
      setCantera(user.cantera);
      setPanaderia(user.panaderia);
      setBosque(user.bosque);
      setMuros(user.muros);
      setAyuntamiento(user.ayuntamiento);
      setHerreria(user.herreria);
//----------------------------------------------------------------
//----------------------------------------------------------------
    }
  }
   // React.MouseEvent<HTMLButtonElement>
   function handleClick(event: any) {  

    const elementoClicado = event.target as HTMLElement;
    const idUE = elementoClicado.id;
    console.log('id UE:', idUE);
    if(!menuButton )    setMenBut(!menuButton);
    if(elementoClicado.id){
      setMenBut2(idUE)
    }


  }
  function viajesuliChat(){
    window.location.replace("/chatuser")
  }
  function handleMensajeria() {
    setMostrarMensajeria(!mostrarMensajeria);
  }























  /////////////////-----------------seba-------------------------
  //---------------------------------
  //------------------------------
  //---------------------------------
  
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handleBuildingMove = (index: number, newX: number, newY: number) => {
    setBuildings(prevBuildings => {
      const updatedBuildings = [...prevBuildings];
      const maxWidth = 1170;
      const maxHeight = 700;
      const buildingWidth = updatedBuildings[index].ancho;
      const buildingHeight = updatedBuildings[index].largo;

      const clampedX = Math.min(Math.max(newX, 0) + 26, maxWidth - buildingWidth);
      const clampedY = Math.min(Math.max(newY, 0), maxHeight - buildingHeight);

      const collidedBuildingIndex = getCollidedBuildingIndex(index, clampedX, clampedY, buildingWidth, buildingHeight);
      if (collidedBuildingIndex !== -1) {
        // Lógica de manejo de colisiones...
      } else {
        updatedBuildings[index].x = clampedX;
        updatedBuildings[index].y = clampedY;

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          guardarEdificioEnBD( updatedBuildings[index].id, clampedX, clampedY, updatedBuildings[index].nivel);
          timeoutId = null;
        }, 500);
      }

      return updatedBuildings;
    });
  };

  const guardarEdificioEnBD = (id: string, posX: number, posY: number, nivel : number) => {
    GuardarEdificio(userId ,id, posX, posY, nivel);
  };


  const updateBuildingCount = async (id: string, costos: number) => {
    // Reemplazar con el ID de usuario actual
    const userIdd = userId; 
    let countsMax = 0;
    
    const newCounts = {

      maderera,
      cantera,
      panaderia,
      bosque,
      muros,
      ayuntamiento,
      herreria,
      pan,
      madera,
      piedra,
    };
  
    switch (id) {
      /*case '663ac05e044ccf6167cf703c':
        if (canon < 3 && piedra >= costos) {
          
          newCounts.canon += 1;// sumo 1  a la cantidad de cañones
         
          
          newCounts.piedra = (piedra - costos); // Deduct costos from piedra
          setCanon(newCounts.canon);
           
          setPiedra(newCounts.piedra);
          
          countsMax = 1;
        } else {
          if (canon >= 3) 
            {setMessage('No puedes tener más de 3 cañones');
          }
         if (piedra < costos) 
          {
            setMessage('No tienes suficiente piedra');
          }
  
  
        }
        break;
      */
  
  
      case '663ac05f044ccf6167cf7041':
        if (maderera < 3 && madera >= costos) {
          newCounts.maderera += 1;
          setMaderera(newCounts.maderera);
          newCounts.madera = (madera - costos);
          setMadera(newCounts.madera);
          countsMax = 1;
        } else {
          console.log('Condition for maderera not met');
        }
        break;
  
  
  
      case '663ac05f044ccf6167cf7040':
        if (cantera < 3) {
          newCounts.cantera += 1;
          setCantera(newCounts.cantera);
          newCounts.madera = (madera - costos);
          setMadera(newCounts.madera);
          countsMax = 1;
        } else {
          console.log('Condition for cantera not met');
        }
        break;
  
  
  
      case '663ac518044ccf6167cf7054':
        if (panaderia < 3 && pan >= costos) {
          newCounts.panaderia += 1;
          newCounts.pan = (pan - costos);
          setPanaderia(newCounts.panaderia);
          setPan(newCounts.pan);
          countsMax = 1;
        } else {
          console.log('Condition for panaderia not met');
        }
        break;
  
  
  
  
      case '663ac060044ccf6167cf7042':
        if (bosque < 3) {
          newCounts.bosque += 1;
          setBosque(newCounts.bosque);
          newCounts.madera = (madera - costos);
          setMadera(newCounts.madera);
          countsMax = 1;
        } else {
          console.log('Condition for bosque not met');
        }
        break;
  
  
  
      case '663ac05f044ccf6167cf703e':
        if (muros < 3) {
          newCounts.muros += 1;
          setMuros(newCounts.muros);
          newCounts.piedra = (piedra - costos);
          setPiedra(newCounts.piedra);
          countsMax = 1;
        } else {
          console.log('No puedes tener más de 3 muros');
        }
        break;
      case '663ac05f044ccf6167cf703d': // ayuntamiento (changed ID)
        if (ayuntamiento < 2) {
          newCounts.ayuntamiento += 1;
          setAyuntamiento(newCounts.ayuntamiento);
          newCounts.madera = (madera - costos);
          setMadera(newCounts.madera);
          countsMax = 1;
        } else {
          console.log('Condition for ayuntamiento not met');
        }
        break;
      case '663ac05f044ccf6167cf703f':
        
        if (herreria < 2) {
          newCounts.herreria += 1;
          setHerreria(newCounts.herreria);
          newCounts.piedra = (piedra - costos);
          setPiedra(newCounts.piedra);
          countsMax = 1;
        } else {
          console.log('Condition for herreria not met');
        }
        break;
    }
  
    try {
      await updateUserBuildings(
        userId,
        newCounts.muros,
        newCounts.bosque,
        newCounts.herreria,
        newCounts.cantera,
        newCounts.maderera,
        newCounts.panaderia,
        newCounts.ayuntamiento,
        newCounts.pan,
        newCounts.madera,
        newCounts.piedra,
      );
      console.log('User buildings count updated successfully.');
    } catch (error) {
      console.error('Error updating user buildings count:', error);
    }
  
    return countsMax;
  };

  //-------------------------
  return (
    <div className="hola flex flex-col items-center justify-center w-screen h-screen bg-gray-900">
      <div className="absolute top-0 left-0 p-4 bg-red-500 text-blue font-bold py-2 px-4 rounded">
      <h3>Usuario: {userId}</h3>
        <h3>Madera: {madera}</h3>
        <h3>Piedra: {piedra}</h3>
        <h3>Pan: {pan}</h3>
        <h3>Canon: {canon}</h3>
        <h3>Maderera: {maderera}</h3>
        <h3>Cantera: {cantera}</h3>
        <h3>Panaderia: {panaderia}</h3>
        <h3>Bosque: {bosque}</h3>
        <h3>Muros: {muros}</h3>
        <h3>Ayuntamiento: {ayuntamiento}</h3>
        <h3>Herreria: {herreria}</h3>
        <h3>Trabajadores disponibles: {unidadesDisponibles}</h3>
        <button onClick={() => recolectarRecursosUser()}> Recolectar Recursos</button>        
      </div>
      <div className='absolute top-0 left-100 p-4 bg-red-500 hover:bg-blue-700 text-blue font-bold py-2 px-4 rounded'>
        <button onClick={() => handleMensajeria()}>Chat</button>
      </div>
      <Mensajeria
        mostrarMensajeria={mostrarMensajeria}
        userLoaded={userLoaded}
        chats={chats}
        chatnames={chatnames}
        handleMensajeria={handleMensajeria}
        getMensajes={getMensajes}
      />
      <div style={{ width: '1200px', height: '700px' }} className="bg-green-500 flex items-center justify-center relative">
      
      <div id="messageDiv" style={messageDivStyle} className="absolute top-0 left-0 p-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded">
    {message}
  </div>
 
  {buildings.map((building, index) => (
          <div
            key={index}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            style={{
              left: `${building.x}px`,
              top: `${building.y}px`,
              width: `${building.ancho}px`,
              height: `${building.largo}px`,
              transform: 'rotateX(45deg) rotateZ(-45deg)',
              transformOrigin: 'center center',
              position: 'absolute',
              cursor: 'pointer',
            }}
            onMouseDown={(e) => handleMouseDown(index, e)}
            
          >
            <div>{building.type} - X: {building.x}, Y: {building.y}</div>
            <button className='bg-red-500 hover:bg-red-700 text-white font-bold  rounded"' 
            onClick={() => {setMenBut(!menuButton); console.log(menuButton)}}>Asignar</button>
              {menuButton ? <MenuAsignar /> : null}
              {/* <div id={building.id} className="dropdowm relative" style={{display:"flex", transform: "rotateX(-32deg) rotateZ(50deg)"}}>                
                <form className=" flex flex-col"  action={updateEdifUser}>                       
                    <input type="number" name="unidadesEdif" placeholder="Nº-trabajadores del edificio" />                    
                    <button type="submit" className=" mt-5 bg-blue-500 hover:bg-blue-700 " >Agregar</button>
                </form>
              </div> */}

          </div>
        ))}
      </div>
      <button
        className="absolute bottom-4 right-4 bg-green-500 hover:bg-white text-white font-bold py-2 px-4 rounded"
        onClick={handleMenuClick}
      >
        Menú
      </button>
      {menuOpen && <MenuDesplegable onBuildClick={handleBuildClick} />}


     
    </div>
  );
};

export default DynamicBuildings;
