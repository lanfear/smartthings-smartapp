import React, { useEffect, useState } from "react";
import { Link  } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import getInstalledSmartApp, { IResponseSmartApp } from "../operations/getInstalledSmartApp";
import getInstalledSmartApps, { IResponseSmartApps } from "../operations/getInstalledSmartApps";

const SmartAppGrid = styled.div`
    display: grid;
    grid-template-columns: 3fr repeat(3, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

interface ISmartAppData {
    [isaId: string]: IResponseSmartApp
}

const SmartApps: React.FC<SmartAppProps> = () => {
    const {t} = useTranslation();

    const [smartApps, setSmartApps] = useState<IResponseSmartApps>([]);
    const [smartAppData, setSmartAppData] = useState<ISmartAppData>({});


    useEffect(() => {
        const getSmartApps = () => {
            setSmartApps(getInstalledSmartApps());
            console.log('getting sa', getInstalledSmartApps());
        }
    
        getSmartApps();
    }, [])

    useEffect(() => {
        const getSmartApp = async (isaId: string) => {
            debugger;
            console.log('getting sa data')
            const updatedSmartAppData = Object.assign([], smartAppData);
            updatedSmartAppData[isaId] = await getInstalledSmartApp(isaId);
            console.log('setting sa data', updatedSmartAppData);
            setSmartAppData(updatedSmartAppData);
        }
    
            // TODO: this is dumb, do them in batch or something
        smartApps.forEach( sa => {
            void getSmartApp(sa);
        })
    }, [smartApps])

    return (
        <SmartAppGrid>
            {Object.values(smartAppData).map(sa => (<>
                <Link to={`/dashboard/${sa.installedAppId}`} >
                    <div>{t('smartapp.label')}: {sa.installedAppId}</div>
                    <div>{t('smartapp.scenes')}: {sa.scenes.length}</div>
                    <div>{t('smartapp.switches')}: {sa.switches.length}</div>
                    <div>{t('smartapp.locks')}: {sa.locks.length}</div>
                </Link>
            </>))}
        </SmartAppGrid>
    )
}

export interface SmartAppProps {
}

export default SmartApps;