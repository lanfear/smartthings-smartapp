import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {useParams} from 'react-router-dom';
import getInstalledSmartApp, {IResponseSmartApp} from '../operations/getInstalledSmartApp';
import {SceneSummary} from '@smartthings/core-sdk';
import {IDevice} from '../types/smartthingsExtensions';
import Device from './Device';

const DashboardTitle = styled.h2`
    font-weight: 600;
`;

const DashboardSubTitle = styled.h3`
    font-weight: 600;
`;

const DashboardSceneGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardDeviceGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardGridColumnHeader = styled.span`
    display: flex;
    justify-content: center;
`;

const Dashboard: React.FC<IDashboardProps> = ({installedAppId}) => {
    const {t} = useTranslation();

    const [dashboardData, setDashboardData] = useState<IResponseSmartApp>({} as IResponseSmartApp);

    const routeInfo = useParams<{installedAppId: string}>();
    installedAppId = routeInfo.installedAppId;

    const sortLabel = (r: IDevice, l: IDevice): 1 | -1 | 0 => {
        const rName = r.label?.toUpperCase() ?? ''; // ignore upper and lowercase
        const lName = l.label?.toUpperCase() ?? ''; // ignore upper and lowercase
        return rName < lName ? -1 : rName > lName ? 1 : 0;
    };

    const sortScene = (r: SceneSummary, l: SceneSummary): 1 | -1 | 0 => {
        const rName = r.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
        const lName = l.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
        return rName < lName ? -1 : rName > lName ? 1 : 0;
    };

    useEffect(() => {
        const getDashboard = async (isaId: string): Promise<void> => {
            const smartAppData = await getInstalledSmartApp(isaId);
            smartAppData.scenes = smartAppData.scenes?.sort(sortScene) ?? [];
            smartAppData.switches = smartAppData.switches?.sort(sortLabel) ?? [];
            smartAppData.locks = smartAppData.locks?.sort(sortLabel) ?? [];
            smartAppData.motion = smartAppData.motion?.sort(sortLabel) ?? [];
            setDashboardData(smartAppData);
        };

        void getDashboard(installedAppId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ignore installedAppId

    const deleteRule = async (isaId: string, ruleId: string): Promise<void> => {
        await fetch(`http://localhost:9190/app/${isaId}/rule/${ruleId}`, {method: 'DELETE'});
    };

    return (
        <>
            <DashboardTitle>
                {dashboardData.installedAppId}
            </DashboardTitle>
            <DashboardSubTitle>
                {t('dashboard.scene.sectionName')}
            </DashboardSubTitle>
            <DashboardSceneGrid>
                <DashboardGridColumnHeader>
                    {t('dashboard.scene.header.sceneName')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.scene.header.sceneId')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.scene.header.createdBy')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.scene.header.createdDate')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.scene.header.lastExecutedDate')}
                </DashboardGridColumnHeader>
                {dashboardData && dashboardData?.scenes?.map(s => (
                    <React.Fragment key={`scene-${s.sceneId as string}`}>
                        <span>
                            {s.sceneName}
                        </span>
                        <span>
                            {s.sceneId}
                        </span>
                        <span>
                            {s.createdBy}
                        </span>
                        <span>
                            {s.createdDate}
                        </span>
                        <span>
                            {s.lastExecutedDate}
                        </span>
                    </React.Fragment>
                ))}
            </DashboardSceneGrid>
            <DashboardSubTitle>
                {t('dashboard.switch.sectionName')}
            </DashboardSubTitle>
            <DashboardDeviceGrid>
                {dashboardData && dashboardData?.switches?.map(s => (
                    <Device
                        key={`switches-${s.deviceId as string}`}
                        device={s}
                        deviceType="Switch"
                    />
                ))}
            </DashboardDeviceGrid>
            <DashboardSubTitle>
                {t('dashboard.lock.sectionName')}
            </DashboardSubTitle>
            <DashboardDeviceGrid>
                {dashboardData && dashboardData?.locks?.map(s => (
                    <Device
                        key={`locks-${s.deviceId as string}`}
                        device={s}
                        deviceType="Lock"
                    />
                ))}
            </DashboardDeviceGrid>
            <DashboardSubTitle>
                {t('dashboard.motion.sectionName')}
            </DashboardSubTitle>
            <DashboardDeviceGrid>
                {dashboardData && dashboardData?.motion?.map(s => (
                    <Device
                        key={`motion-${s.deviceId as string}`}
                        device={s}
                        deviceType="Motion"
                    />
                ))}
            </DashboardDeviceGrid>
            <DashboardRuleGrid>
                <DashboardGridColumnHeader>
                    {t('dashboard.rule.header.name')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.rule.header.ruleId')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.rule.header.status')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.rule.header.ownerId')}
                </DashboardGridColumnHeader>
                <DashboardGridColumnHeader>
                    {t('dashboard.rule.header.manage')}
                </DashboardGridColumnHeader>
                {dashboardData && dashboardData.rules?.map(s => (
                    <React.Fragment key={`rules-${s.id}`}>
                        <span>
                            {s.name}
                        </span>
                        <span>
                            {s.id}
                        </span>
                        <span>
                            {s.executionLocation}
                        </span>
                        <span>
                            {s.ownerId}
                        </span>
                        <button onClick={() => deleteRule(installedAppId, s.id)}>
                            DELETE
                        </button>
                    </React.Fragment>
                ))}
            </DashboardRuleGrid>
        </>
    );
};

export interface IDashboardProps {
    installedAppId: string;
}

export default Dashboard;