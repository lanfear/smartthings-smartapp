import React, { useEffect, useState } from "react";
import { Link  } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import getInstalledSmartApp, { IResponseSmartApp } from "../operations/getInstalledSmartApp";
import getInstalledSmartApps, { IResponseSmartApps } from "../operations/getInstalledSmartApps";
import { Rule, RuleRequest } from "@smartthings/core-sdk";
import { generateActionSwitchLevel, generateConditionBetween, generateConditionMotion } from "../factories/ruleFactory";

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

    const betweenCondition = generateConditionBetween(parseInt(process.env.REACT_APP_RULE_START_TIME_OFFSET ?? ''), parseInt(process.env.REACT_APP_RULE_END_TIME_OFFSET ?? ''));
    const motionCondition = generateConditionMotion(process.env.REACT_APP_RULE_MOTION_DEVICEID ?? '');
    const switchAction = generateActionSwitchLevel(process.env.REACT_APP_RULE_SWITCH_DEVICEID ?? '', 75);
    const newRule: RuleRequest = {
        name: "Motion Family Room",
        actions: [
            {
                if: {
                    and: [
                        betweenCondition, 
                        motionCondition
                    ],
                    then: [
                        switchAction
                    ]
                }
            }
        ]
    };

    const addRule = async (isaId: string) => {
        const response = await fetch(`http://localhost:9190/app/${isaId}/rule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRule)
        });
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