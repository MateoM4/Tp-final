'use client'
import React, { useState, useEffect, useRef } from 'react';
import MenuDesplegable from './menuDesplegable';
import MenuAsignar from './menuAsignar';
import Recursos from './recursos';
import { GuardarEdificio, getBuildingsByUserId, builtEdificio, getEdificionameByUE, getBuildingCount, getUEbyUserId, getUEById, updateBuildingCount, getOneBuildingsByUserId } from '../../services/userEdificios'
import { getUser, updateLevelUser } from '@/services/users';
import { getReturnByCooki, getUserByCooki, } from '@/services/users';
import { recolectarRecursos, calcularMadera, calcularPiedra, calcularPan } from '@/services/recursos';
import { getChats, getChatName } from '@/services/chats';
import { getMensajes } from '@/services/mensajes';
import { getImagenesEdificios } from '@/services/edificios';
import ButtonUser from './buttonUser';
import Image from 'next/image';
import ImageFloor from '../../../public/Images/FloorImage.jpeg';
import PantallaCarga from './pantallaCarga';
import backgroundMain from '../../../public/Images/backgroundMain.jpg'



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
  const [boxError, setBoxError] = useState(false);
  const [error, setError] = useState("");
  const [nivelUser, setNivelUser] = useState(1);
  const [unidadesTrabajando, setUnidadesTrabajando] = useState(1);
  // para la mensajeria
  const [userLoaded, setUserLoaded] = useState(false);
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatnames, setChatNames] = useState<string[]>([]);

  const mouseMoveRef = useRef<(e: MouseEvent) => void>(() => { });
  const mouseUpRef = useRef<() => void>(() => { });

  //para las imagenes de los edificios
  const [imgs, setImgs] = useState<Map<string, string>>(new Map());
  //para la foto de perfil
  const [profileImage, setProfileImage] = useState<string>('');

  //para la pantalla de carga (deben ser todas falsas para que se oculte la pantalla de carga)	
  const [cargandoPrincipal, setCargandoPrincipal] = useState(true)
  const [cargandoChats, setCargandoChats] = useState(true)
  const [cargandoImagenes, setCargandoImagenes] = useState(true) //por ahora lo dejo en false xq no anda
  const [cantidadEdificios, setCantidadEdificios] = useState(0)
  const [imagenesCargadas, setImagenesCargadas] = useState(0)
  //----------------------------------------------------------
  //region VERIFICAR COOKIE

  let estado = false;
  const [message, setMessage] = useState('');

  //para que la generacion de recursos no interfiera con las compras
  const [construyendo, setConstruyendo] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const messageDivStyle = {
    display: message ? 'block' : 'none', // Mostrar el mensaje solo cuando hay un mensaje para mostrar
  };
  useEffect(() => {
    async function verificarCooki() {
      //obtengo el valor de la cookie user
      if (!estado) {
        await getReturnByCooki()
        estado = !estado
      }

    }
    verificarCooki()
    const intervalId = setInterval(() => {
      estado = !estado
    }, 5000);
    return () => clearInterval(intervalId);
  }, [estado])
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
        cargarImagenes();
        //para la pantalla de carga
        //por si no tiene edificios construidos
        if (fetchedBuildings.length === 0) { setCargandoImagenes(false) }
        //por si nunca chateo
        if (chats.length === 0) { setCargandoChats(false) }
        setCantidadEdificios(fetchedBuildings.length)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        //avisar que se cargaron los datos
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
          // avisar que se cargaron los chats
          setCargandoChats(false)
        });
    }
  }, [chats, userId]);


  //#region METODOS HANDLE
  const handleBuildClick = async (id_edi: string, x: number, y: number, buildingType: string, ancho: number, largo: number, costos: number, cantidad: number, recurso: number) => {
    // para asegurar que no interefiera la generación de recursos con la construcción
    setConstruyendo(true);
    const existingBuilding = false //buildings.find(building => building.x === x && building.y === y && building.id === id);

    if (!existingBuilding) {


      // Actualizar el estado del usuario
      const construir = await updateBuildingCount(userId, cantidad, costos, id_edi, recurso); // devuelve 1 si se puede construir, 0 si no
      if (typeof construir === "string") {
        setError(construir)
        return setBoxError(true)
      }
      
      //window.location.reload();
      // Llamar a la función para guardar el edificio en la base de datos

      if (construir === 1) {
        buildings.find(building => building.x === x && building.y === y && building.id === id_edi);

        try {
          // Evita recargar la página, en su lugar actualiza el estado
          const edif = await builtEdificio(userId, id_edi, x, y, 1);
          console.log('Edificio guardado exitosamente en la base de datos.');
          if (edif) {
            const newEdif = await getOneBuildingsByUserId(userId, (edif.edificio.id));
            console.log('Edificio:', newEdif);
            if (newEdif != null && newEdif !== undefined) {
              setBuildings(prevBuildings => [...prevBuildings, newEdif]);
              setMenuOpen(false)

              //restar recursos de la construcción  
              const userActualizado = await getUser(userId)
              if(userActualizado != null){
                setMadera(userActualizado.madera);
                setPiedra(userActualizado.piedra);
                setPan(userActualizado.pan);
              }
            } else {
              console.error('No se encontró el edificio con el ID de usuario dado');
            }
          }

        } catch (error) {
          console.error('Error al guardar el edificio en la base de datos:', error);
        }
      }
    } else {
      console.log('Ya hay un edificio del mismo tipo en estas coordenadas');
    }
    setConstruyendo(false);
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

 
  const cargarUser = async () => {
    const user = await getUserByCooki()
    /* const user = await getUser(usoCooki().then(x =>x?.id)) */
    if (user != null) {
      //console.log('Usuario:', user)
      setMadera(user.madera);
      setPiedra(user.piedra);
      setPan(user.pan);
      setUser(String(user.username));
      setUnidadesDisp(user.unidadesDeTrabajo)
      setUserId(user.id);
      setNivelUser(user.nivel)
      console.log("user.profileImage", user.profileImage)
      setProfileImage(String(user.profileImage));
    }
  }

  //region Nico
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
  useEffect(() => {
    if (boxError) {
      const intervalId = setInterval(() => {
        setBoxError(false)
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [boxError])
  function handleMensajeria() {
    setMostrarMensajeria(!mostrarMensajeria);
  }
  async function subirNivel() {

    const valorNivel = await updateLevelUser(userId, madera, piedra, pan)
    if (typeof valorNivel === "string") {
      setError(valorNivel)
      return setBoxError(true)
    }
    setMadera(prev => prev - Number(valorNivel))
    setPiedra(prev => prev - Number(valorNivel))
    setPan(prev => prev - Number(valorNivel))
    setNivelUser(prev => prev + 1)
    console.log("El usuario subió de nivel")

  }
  const mostrarUnidTrab = async (id: string) => {
    const UE = await getUEById(id)
    setUnidadesTrabajando(prev => prev + Number(UE?.trabajadores))

  }

  //region seba
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
          GuardarEdificio(userId, updatedBuildings[index].id, clampedX, clampedY, updatedBuildings[index].nivel);
          timeoutId = null;
        }, 500);
      }

      return updatedBuildings;
    });
  };

  //region update nuevo

  //endregion

  //region IMAGENES DE LOS EDIFICIOS
  //metodos para las imagenes de los edificios


  const cargarImagenes = async () => {
    const img = await getImagenesEdificios();
    setImgs(img);
  }

  const handleCargaImagenes = () => {
    setImagenesCargadas(prevImagenesCargadas => {
      const newImagenesCargadas = prevImagenesCargadas + 1;
      if (newImagenesCargadas == cantidadEdificios) {
        setCargandoImagenes(false)
        console.log("imagenes cargadas", newImagenesCargadas, "de", cantidadEdificios)
        console.log("ocultando pantalla de carga...")
      }
      console.log("imagenes cargadas", newImagenesCargadas, "de", cantidadEdificios)
      return newImagenesCargadas;
    });
  }


  //region RETURN 
  return (
    <>

      <div className="hola flex  items-center justify-center w-screen h-screen bg-gray-900" 
          style={{
          backgroundImage: `url(${backgroundMain.src})`,
          backgroundSize: 'cover'

        }}>
        <PantallaCarga cargandoPrincipal={cargandoPrincipal} cargandoChats={cargandoChats} cargandoImagenes={cargandoImagenes}>
        </PantallaCarga>
        <div style={{ backgroundColor: 'rgba(131, 1, 21, 255)', border: '2mm ridge rgba(0, 0, 0, .7)', fontSize: 18 }} className=" mb-20 absolute top-2 left-2  bg-red-500 text-yellow-500 font-stoothgart py-2 px-4 rounded">
          <Recursos
            usuario={usuario}
            setNivelUser={setNivelUser}
            nivelUser={nivelUser}
            userId={userId}
            madera={madera}
            setMadera={setMadera}
            piedra={piedra}
            setPiedra={setPiedra}
            pan={pan}
            setPan={setPan}
            unidadesDisponibles={unidadesDisponibles}
            cargarUser={cargarUser}
            construyendo={construyendo}
          />
        </div>

          
        <div className=' text-yellow-500 font-stoothgart absolute left-2 top-100 ' style={{ backgroundColor: 'rgba(131, 1, 21, 255)', border: '2mm ridge rgba(0, 0, 0, .7)', fontSize: 18 }}>
          <h3>Recursos para subir de nivel:</h3>

          <div className='flex flex-col'>
            <p />
            <span>_Madera: {nivelUser * 5000}</span>
            <span>_Piedra: {nivelUser * 5000}</span>
            <span>_Pan: {nivelUser * 5000}</span>
          </div>

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

              className={` text-white font-bold py-2 px-4 rounded`}
              style={{
                left: `${building.x}px`,
                top: `${building.y}px`,
                width: `${building.ancho}px`,
                height: `${building.largo}px`,
                transformOrigin: 'center center',
                position: 'absolute',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onDoubleClick={(e) => { handleClick(e); mostrarUnidTrab }}
            >
              <Image
                src={`/Images/edificios/${imgs.get(building.edificioId)}`}
                alt={building.type}
                className="absolute inset-0 w-full h-full"
                width={building.ancho}
                height={building.largo}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                onLoad={() => handleCargaImagenes()}
              />


              {((idUEClick == building.id) && menuButton) ? <MenuAsignar
                idUE={building.id}
                cerrarCompuerta={setMenBut}
                setError={setError}
                setBoxError={setBoxError}
                setPan={setPan}
                setUnidadesDisp={setUnidadesDisp}
                unidadesTrabajando={unidadesTrabajando} /> : null}

            </div>

          ))}
          {boxError &&
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded z-50">
              <h1 className=" flex justify-center items-center font-stoothgart text-black-400 ">{error}</h1>
            </div>
          }
        </div>
        <button
          style={{ backgroundColor: 'rgba(131, 1, 21, 255)', border: '2mm ridge rgba(0, 0, 0, .7)', fontSize: 18 }}
          className="absolute bottom-4 left-2 bg-green-400 hover:bg-green-700 text-yellow-500 font-stoothgart py-2 px-4 rounded"
          onClick={handleMenuClick}
        >
          Construir Edificios
        </button>
        {menuOpen && <MenuDesplegable onBuildClick={handleBuildClick} />}

        <div className=" text-black absolute top-4 right-0 " >
          <button style={{ backgroundColor: 'rgba(131, 1, 21, 255)', border: '2mm ridge rgba(0, 0, 0, .7)', fontSize: 18 }}
            className='py-2 px-4 absolute top-0 right-10 rounded font-stoothgart text-yellow-400'
            onClick={() => setUserButton(!userButton)}>Perfil</button>

          <div className=' text-black px-4'>
            {userButton && <ButtonUser
              userId={userId}
              subirNivel={subirNivel}
              username={usuario}
              profileImage={profileImage}
              mostrarMensajeria={mostrarMensajeria}
              userLoaded={userLoaded}
              chats={chats}
              chatnames={chatnames}
              handleMensajeria={handleMensajeria}
              getMensajes={getMensajes}
              nivelUser={nivelUser} />
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default DynamicBuildings;
