import { use, useEffect, useState } from "react";
import React from "react";
import backgroundImage from '../../../public/Images/Papyre.png';
interface pantallaCargaProps {
    cargandoPrincipal: boolean
    cargandoChats: boolean
    cargandoImagenes: boolean
}
const PantallaCarga: React.FC<pantallaCargaProps> = ({ cargandoPrincipal, cargandoChats, cargandoImagenes }) => {

    const [puntos, setPuntos] = useState(".  ");

    useEffect(() => {
        if (cargandoPrincipal || cargandoChats || cargandoImagenes) {
            const interval = setInterval(() => {
                switch (puntos) {
                    case ".  ":
                        setPuntos(".. ");
                        break;
                    case ".. ":
                        setPuntos("...");
                        break;
                    case "...":
                        setPuntos(".  ");
                        break;
                }
            }, 400);
            return () => clearInterval(interval);
        }
    }, [puntos]);

    if (cargandoPrincipal || cargandoChats || cargandoImagenes) {
        return (
            <div className="flex flex-col items-center justify-center fixed inset-0 w-full h-full z-50 opacity-80" style={{
                backgroundImage: `url(${backgroundImage.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

                <h1 className="border-solid mb-4 text-8xl font-stoothgart text-black-500">Cargando{puntos}</h1>
            </div>
        )
    }
    else null
}

export default PantallaCarga;