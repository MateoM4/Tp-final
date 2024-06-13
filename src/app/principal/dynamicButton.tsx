'use client'
import React, { useState, useEffect, useRef, use } from 'react';
import MenuDesplegable from './menuDesplegable';
import MenuAsignar from './menuAsignar';
import Mensajeria from './menuChats';
import Recursos from './recursos';
import { GuardarEdificio, getBuildingsByUserId, builtEdificio, getUEbyUserId, getUEById, getEdificionameByUE } from '../../services/userEdificios';
import { getReturnByCooki, getUserByCooki, updateUserBuildings } from '@/services/users';
import { recolectarRecursos, calcularMadera, calcularPiedra, calcularPan } from '@/services/recursos';
import { getChats, getChatName } from '@/services/chats';
import { getMensajes } from '@/services/mensajes';
import { getEdificioById, getImagenEdificio } from '@/services/edificios';
import ButtonUser from './buttonUser';
import Image from 'next/image';
import ImageFloor from '../../../public/Images/FloorImage.jpeg';
import PantallaCarga from './pantallaCarga';
import { truncate, truncateSync } from 'fs';


type Building = {
  x: number;
  y: number;
  type: string;
  ancho: number;
  largo: number;
  id: string;
  nivel: number;
  costo: number;
  cantidad: number;
  edificioId: string;
};

const DynamicBuildings: React.FC = () => {

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draggedBuildingIndex, setDraggedBuildingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [madera, setMadera] = useState(0);
  const [piedra, setPiedra] = useState(0);
  const [pan, setPan] = useState(0);
  const [unidadesDisponibles, setUnidadesDisp] = useState(0)
  const [usuario, setUser] = useState('');
  const [userId, setUserId] = useState('')

  //NICO
  const [menuButton, setMenBut] = useState(false);   //cuando se cliclea un botón se habilita la compuerta que habre el formulario de asignar unidades
  const [idUEClick, setIdUEClick] = useState("");    //id de userEdificios seleccionado ante un click
  const [userButton, setUserButton] = useState(false); //compuerta para el botón de usuario.
  ////-----------------------------------------------------------
  //---------------------seba--------------------------------------
  //-----------------------------------------------------------
  const [canon, setCanon] = useState(0);
  const [maderera, setMaderera] = useState(0);
  const [cantera, setCantera] = useState(0);
  const [panaderia, setPanaderia] = useState(0);
  /* const [bosque, setBosque] = useState(0); */
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



  const mouseMoveRef = useRef<(e: MouseEvent) => void>(() => { });
  const mouseUpRef = useRef<() => void>(() => { });

  //para las imagenes de los edificios
  const [images, setImages] = useState<{ [key: string]: string }>({});

  //para la pantalla de carga
  const [cargandoPrincipal, setCargandoPrincipal] = useState(true)
  const [cargandoChats, setCargandoChats] = useState(true)
  const [cargandoImagenes, setCargandoImagenes] = useState(false)
  const [cantidadEdificios, setCantidadEdificios] = useState(0)
  const [imagenesCargadas, setImagenesCargadas] = useState(0)


  //----------------------------------------------------------
  //region VERIFICAR COOKIE

  /*  let estado = false;
 
   useEffect(() => { 
     async function verificarCooki() {
       //obtengo el valor de la cookie user
       if(!estado) {
         await getReturnByCooki() 
         estado = !estado
       }
       
     } 
     verificarCooki()      
       const intervalId = setInterval(() => {
         estado = !estado
           
         }, 5000);
         return () => clearInterval(intervalId);
   }, [estado])  */
  //----------------------------------------------------------
  //#region USEEFFECTS USUARIO
  //useffect para obetener el id de user 
  useEffect(() => {
    async function fetchData() {
      try {
        let resultado = await getUserByCooki();
        let usuarioId = String(resultado?.id);
        if (!usuarioId) {
          console.error('No user ID found');
          return;
        }
        console.log(usuarioId);
        setUserId(String(usuarioId));
        setUserLoaded(true);
        cargarUser();
        const [fetchedBuildings, chats] = await Promise.all([
          getBuildingsByUserId(usuarioId),
          getChats(usuarioId),
        ]);
        setBuildings(fetchedBuildings);
        console.log("fetchedBuildings", fetchedBuildings);
        setChats(chats);
        console.log('Chats:', chats);
        //cargar imagenes
        mapearImagenes(fetchedBuildings);
        //para la pantalla de carga
        setCantidadEdificios(fetchedBuildings.length)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        //fetch principal terminado
        setCargandoPrincipal(false)
      }
    }
    fetchData();
  }, [userId]);


  //useffects recursos automaticos -> BORRADOS AHORA ESTAN EN EL COMPONENTE RECURSOS


  //conseguir todos los nombres de los chats
  useEffect(() => {
    if (chats.length > 0 && userId) {
      console.log('Fetching chat names...')
      Promise.all(chats.map(chat => getChatName(chat, userId)))
        .then(chatnames => {
          setChatNames(chatnames);
          console.log('Chat names:', chatnames);
        })
        .catch(error => console.error('Error fetching chat names:', error))
        .finally(() => {
          // chats cargados
          setCargandoChats(false)
        });
    }
  }, [chats, userId]);

  const handleBuildClick = async (id: string, x: number, y: number, buildingType: string, ancho: number, largo: number, costos: number, cantidad: number) => {
    const existingBuilding = false //buildings.find(building => building.x === x && building.y === y && building.id === id);

    if (!existingBuilding) {


      // Actualizar el estado del usuario
      const construir = await updateBuildingCount(cantidad,/* id,  */costos, id); // devuelve 1 si se puede construir, 0 si no
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


  const guardarEdificioEnBD = (id: string, posX: number, posY: number, nivel: number) => {
    GuardarEdificio(userId, id, posX, posY, nivel);
  };

  const guardarAldea = () => {
    buildings.forEach(building => {
      guardarEdificioEnBD(building.id, building.x, building.y, building.nivel);
    });
  };
  const recolectarRecursosUser = async () => {
    /*     "use server" */
    const user = await getUserByCooki()
    if (user != null) {
      await recolectarRecursos(user.id);
      setMadera(Number(user));
      setPiedra(user.piedra);
      setPan(user.pan);
    }
  }
  const cargarUser = async () => {
    const user = await getUserByCooki()
    /* const user = await getUser(usoCooki().then(x =>x?.id)) */
    if (user != null) {
      setMadera(user.madera);
      setPiedra(user.piedra);
      setPan(user.pan);
      setUser(String(user.username));
      setUnidadesDisp(user.unidadesDeTrabajo)
      setUserId(user.id);
      setMaderera(Number(user.maderera));
      setCantera(Number(user.cantera));
      setPanaderia(Number(user.panaderia));
      /*       setBosque(Number(user.bosque)); */
      setMuros(Number(user.muros));
      setAyuntamiento(Number(user.ayuntamiento));
      setHerreria(Number(user.herreria));
    }
  }

  /*    async function getNameEdificio(idUE:any) {
       return await getEdificionameByUE(idUE)
     } */
  //método para obtener el id del userEdificio seleccionado
  async function handleClick(event: any) {
    //si la compuerta ya esta abierta no ejecutar este código
    if (menuButton) return
    const elementoClicado = event.target as HTMLElement;
    const idUE = elementoClicado.id;
    console.log('id UE:', idUE);
    const edificioName = await getEdificionameByUE(idUE)
    console.log("edificiooooooooooooo:", edificioName)
    if (!menuButton && (edificioName == "maderera" || edificioName == "cantera" || edificioName == "panaderia")) setMenBut(true);
    if (elementoClicado.id) {
      setIdUEClick(idUE)
    }
  }

  function handleMensajeria() {
    setMostrarMensajeria(!mostrarMensajeria);
  }

  //region-----------------seba-------------------------
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
          guardarEdificioEnBD(updatedBuildings[index].id, clampedX, clampedY, updatedBuildings[index].nivel);
          timeoutId = null;
        }, 500);
      }

      return updatedBuildings;
    });
  };

  //region update nuevo
  const updateBuildingCount = async (cantidad: number, costos: number, id: string) => {
    // Reemplazar con el ID de usuario actual
    let countsMax = 0;

    const newCounts = {

      muros,
      maderera,
      cantera,
      panaderia,
      //      bosque, 
      ayuntamiento,
      herreria,
      pan,
      madera,
      piedra,
    };

    let cantEdificio;
    let nombreEdificio;
    let indexEdificio;
    await getEdificioById(id).then((edificio) => {
      nombreEdificio = String(edificio?.name);
      console.log("----------------paso1, ", nombreEdificio)

    }
    );

    for (let i in newCounts) {
      console.log("----------------paso2, i:", i, "nombreEdificio:", nombreEdificio)
      if (nombreEdificio == i) {
        cantEdificio = newCounts[i];

        console.log("----------------paso3, ", cantEdificio)

        console.log("----------------paso4, cantidad: ", cantidad)
        if (cantidad > Number(cantEdificio) && madera >= costos && piedra >= costos) {
          newCounts.panaderia += 1;
          newCounts.madera = madera - costos;
          newCounts.piedra = piedra - costos;
          setPiedra(newCounts.piedra);
          setMadera(newCounts.madera);

          countsMax = 1;
        } else {
          if (Number(cantEdificio) >= cantidad) {
            setMessage("Debes tener ayuntamiento en nivel 5 para poder construir más " + nombreEdificio);
          }
          if (madera < costos) {
            setMessage('No tienes suficiente medera para construir.');
          }
        }
      }
    }



    try {
      await updateUserBuildings(
        userId.toLowerCase(),
        newCounts.muros,
        //newCounts.bosque,
        newCounts.herreria,
        newCounts.cantera,
        newCounts.maderera,
        newCounts.panaderia,
        newCounts.ayuntamiento,
        newCounts.pan,
        newCounts.madera,
        newCounts.piedra
      );
      console.log('User buildings count updated successfully.');
    } catch (error) {
      console.error('Error updating user buildings count:', error);
    }
    console.log("----------------paso5, countMax ", countsMax)
    return countsMax;
  };

  const mapearImagenes = async (localbuildings: any) => {
    const imagenes: { [key: string]: string } = {};
    for (let edificio of localbuildings) {
      if (edificio.edificioId) {
        const imagen = await getImagenEdificio(edificio.edificioId);
        if (imagen) {
          imagenes[edificio.edificioId] = String(imagen);
        }
      }
    }
    setImages(imagenes);
    console.log('Imagenes:', imagenes);
  }

  const handleCargaImagenes =  () => {
    setImagenesCargadas(imagenesCargadas + 1)
    if (imagenesCargadas == cantidadEdificios) {
      setCargandoImagenes(false)
    }
    console.log("imagenes cargadas", imagenesCargadas, "de", cantidadEdificios) 
  }
  //region update viejo
  /*  const updateBuildingCount = async (id: string, costos: number) => {  
    let countsMax = 0;
    
    const newCounts = {
  
      muros,
      maderera,
      cantera,
      panaderia,
//      bosque, 
      ayuntamiento,
      herreria,
      pan,
      madera,
      piedra,
    };
    switch (id) {
      
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
        if (ayuntamiento < 1) {
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
        //newCounts.bosque,
        newCounts.herreria,
        newCounts.cantera,
        newCounts.maderera,
        newCounts.panaderia,
        newCounts.ayuntamiento,
        newCounts.pan,
        newCounts.madera,
        newCounts.piedra
      );
      console.log('User buildings count updated successfully.');
    } catch (error) {
      console.error('Error updating user buildings count:', error);
    }
  
    return countsMax;
  };  */



  //region hasta aca seba-------------------------
  return (
    <div className="hola flex flex-col items-center justify-center w-screen h-screen bg-gray-900">
      <PantallaCarga cargandoPrincipal={cargandoPrincipal} cargandoChats={cargandoChats} cargandoImagenes={cargandoImagenes}>  
      </PantallaCarga>
      <div className="absolute top-0 left-0 p-4 bg-red-500 text-blue font-bold py-2 px-4 rounded">
        <Recursos
          usuario={usuario}
          userId={userId}
          madera={madera}
          setMadera={setMadera}
          piedra={piedra}
          setPiedra={setPiedra}
          pan={pan}
          setPan={setPan}
          unidadesDisponibles={unidadesDisponibles}
          cargarUser={cargarUser}
        />
      </div>


      <div style={{ 
      width: '1200px', 
      height: '700px',
      backgroundImage: `url(${ImageFloor.src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
       }} className="bg-green-500 flex items-center justify-center relative">
        
        {buildings.map((building, index) => (
          <div
            key={index}
            id={building.id}

            className={` bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            style={{
              left: `${building.x}px`,
              top: `${building.y}px`,
              width: `${building.ancho}px`,
              height: `${building.largo}px`,
              //transform: 'rotateX(45deg) rotateZ(-45deg)',
              transformOrigin: 'center center',
              position: 'absolute',
              cursor: 'pointer',
            }}
            onMouseDown={(e) => handleMouseDown(index, e)}
            onClick={(e) => handleClick(e)}

          >
            <Image
               src={`/Images/${images[building.edificioId] || 'default.png'}`}
              alt={building.type}
              layout="fill"
              objectFit="cover"
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }} // para que el click no interaccione con la imagen
              onLoadingComplete={() => handleCargaImagenes()} // para que por cada imagen cargada se actualice el contador
            />
              


            {/*<div>{building.type} - X: {building.x}, Y: {building.y}</div>*/}

            {((idUEClick == building.id) && menuButton) ? <MenuAsignar idUE={building.id} cerrarCompuerta={setMenBut} estadoCompuerta={menuButton} /> : null}

          </div>

        ))}
      </div>
      <button
        className="absolute bottom-4 left-4 bg-green-400 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleMenuClick}
      >
        Construir Edificios
      </button>
      {menuOpen && <MenuDesplegable onBuildClick={handleBuildClick} />}

      <div className=" text-black absolute top-4 right-0 " >
        <button className='py-2 px-4 absolute top-0 right-2 bg-slate-400 rounded' onClick={() => setUserButton(!userButton)}>Hola</button>

        <div className=' text-black px-4'>
          {userButton && <ButtonUser
            userId={userId}
            mostrarMensajeria={mostrarMensajeria}
            userLoaded={userLoaded}
            chats={chats}
            chatnames={chatnames}
            handleMensajeria={handleMensajeria}
            getMensajes={getMensajes} />
          }
        </div>
      </div>
    </div>

  );
};

export default DynamicBuildings;
