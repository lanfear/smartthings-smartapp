import React, { useEffect, useState } from "react";
import { Link  } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import getInstalledSmartApp, { IResponseSmartApp } from "../operations/getInstalledSmartApp";
import getInstalledSmartApps, { IResponseSmartApps } from "../operations/getInstalledSmartApps";
import { Rule } from "@smartthings/core-sdk";

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

    const addRule = async (isaId: string) => {
        const response = await fetch(`http://localhost:9190/app/${isaId}/rule/add`, {method: 'PUT'});
        const responseBody = await response.json() as Rule;
        return responseBody;
    };

    useEffect(() => {
        const getSmartApps = async () => {
            setSmartApps(await getInstalledSmartApps());
        }
    
        void getSmartApps();
    }, [])

    useEffect(() => {
        const getSmartApp = async (isaId: string) => {
            const updatedSmartAppData = Object.assign([], smartAppData);
            updatedSmartAppData[isaId] = await getInstalledSmartApp(isaId);
            setSmartAppData(updatedSmartAppData);
        }
    
            // TODO: this is dumb, do them in batch or something
        smartApps.forEach( sa => {
            void getSmartApp(sa);
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [smartApps]) // ignore smartAppData

    return (
        <SmartAppGrid>
            {Object.values(smartAppData).map(sa => (<>
                <Link to={`/dashboard/${sa.installedAppId}`} >
                    <div>{t('smartapp.label')}: {sa.installedAppId}</div>
                    <div>{t('smartapp.sceneCount')}: {sa.scenes.length}</div>
                    <div>{t('smartapp.switchCount')}: {sa.switches.length}</div>
                    <div>{t('smartapp.lockCount')}: {sa.locks.length}</div>
                    <div>{t('smartapp.motionCount')}: {sa.motion.length}</div>
                </Link>
                <button onClick={() => addRule(sa.installedAppId)}>Add The Rule</button>
            </>))}
        </SmartAppGrid>
    )
}

export interface SmartAppProps {
}

export default SmartApps;