'use client'
import React, { useEffect, useRef, useState } from 'react';
import { calcularMadera, calcularPan, calcularPiedra } from '@/services/recursos';
import { updateUser } from '@/services/users';

interface RecursosProps {
    usuario: string;
    userId: string;
    madera: number;
    setMadera: React.Dispatch<React.SetStateAction<number>>;
    piedra: number;
    setPiedra: React.Dispatch<React.SetStateAction<number>>;
    pan: number;
    setPan: React.Dispatch<React.SetStateAction<number>>;
    unidadesDisponibles: number;
    cargarUser: () => void;
}

const Recursos: React.FC<RecursosProps> = ({ usuario, userId,madera, setMadera, piedra, setPiedra, pan, setPan, unidadesDisponibles, cargarUser}) => {

    const maderaRef = useRef(madera);
    const piedraRef = useRef(piedra);
    const panRef = useRef(pan);
    const [maderaPorSegundo, setMaderaPorSegundo] = useState(0);
    const [piedraPorSegundo, setPiedraPorSegundo] = useState(0);
    const [panPorSegundo, setPanPorSegundo] = useState(0);
    //useffects recursos automaticos
    //useffect para recolectar recursos automaticamente CAMBIAR 50 POR 5
    useEffect(() => {
        const fetchResource = async (calculateFunc: (id: string) => Promise<number>, setFunc: (value: number) => void) => {
            try {
                const result = await calculateFunc(userId);
                setFunc(result);
            } catch (error) {
                console.error(`Error fetching resource: ${error}`);
            }
        };

        if (userId) {
            Promise.all([
                fetchResource(calcularMadera, setMaderaPorSegundo),
                fetchResource(calcularPiedra, setPiedraPorSegundo),
                fetchResource(calcularPan, setPanPorSegundo),
            ]);
        }
    }, [userId]);

    useEffect(() => {
        cargarUser();
        const timer = setInterval(() => {
            setMadera(madera => madera + maderaPorSegundo);
            setPiedra(piedra => piedra + piedraPorSegundo);
            setPan(pan => pan + panPorSegundo);
        }, 2000);

        return () => clearInterval(timer);
    }, [maderaPorSegundo, piedraPorSegundo, panPorSegundo]);

    useEffect(() => {
        maderaRef.current = madera;
    }, [madera]);

    useEffect(() => {
        piedraRef.current = piedra;
    }, [piedra]);

    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    useEffect(() => {
        const timer = setInterval(async () => {
            try {
                await updateUser(userId, { madera: maderaRef.current, piedra: piedraRef.current, pan: panRef.current });
                console.log('recursos actualizados');
            } catch (error) {
                console.error(`Error updating user: ${error}`);
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [userId]);

    return (
        <div>
            <h3>Usuario: {usuario}</h3>
            <h3>Madera: {madera} || PS: {maderaPorSegundo}</h3>
            <h3>Piedra: {piedra} || PS: {piedraPorSegundo}</h3>
            <h3>Pan: {pan} || PS: {panPorSegundo}</h3>
            <h3>Trabajadores disponibles: {unidadesDisponibles}</h3>
        </div>
    );
};

export default Recursos;