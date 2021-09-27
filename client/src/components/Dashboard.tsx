import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import getInstalledSmartApp, { IResponseSmartApp } from "../operations/getInstalledSmartApp";

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

const DashboardGridColumnHeader = styled.span`
    display: flex;
    justify-content: center;
`;

const Dashboard: React.FC<IDashboardProps> = ({installedAppId}) => {
    const {t} = useTranslation();

    const [dashboardData, setDashboardData] = useState<IResponseSmartApp>({} as IResponseSmartApp);

    const routeInfo = useParams();
    installedAppId = routeInfo.installedAppId;

    useEffect(() => {
        const getDashboard = async (isaId: string) => {
            setDashboardData(await getInstalledSmartApp(isaId));
        }

        void getDashboard(installedAppId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (<>
        <DashboardTitle>{dashboardData.installedAppId}</DashboardTitle>
        <DashboardSubTitle>{t('dashboard.scene.sectionName')}</DashboardSubTitle>
        <DashboardSceneGrid>
            <DashboardGridColumnHeader>{t('dashboard.scene.header.sceneName')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.scene.header.sceneId')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.scene.header.createdBy')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.scene.header.createdDate')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.scene.header.lastExecutedDate')}</DashboardGridColumnHeader>
            {dashboardData && dashboardData?.scenes?.map(s => (<React.Fragment key={`scene-${s.sceneId}`}>
                <span>{s.sceneName}</span>
                <span>{s.sceneId}</span>
                <span>{s.createdBy}</span>
                <span>{s.createdDate}</span>
                <span>{s.lastExecutedDate}</span>
            </React.Fragment>))}
        </DashboardSceneGrid>
        <DashboardSubTitle>{t('dashboard.switch.sectionName')}</DashboardSubTitle>
        <DashboardDeviceGrid>
            <DashboardGridColumnHeader>{t('dashboard.switch.header.label')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.switch.header.deviceId')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.switch.header.value')}</DashboardGridColumnHeader>
            {dashboardData && dashboardData?.switches?.map(s => (<React.Fragment key={`switches-${s.deviceId}`}>
                <span>{s.label}</span>
                <span>{s.deviceId}</span>
                <span>{s.value}</span>
            </React.Fragment>))}
        </DashboardDeviceGrid>
        <DashboardSubTitle>{t('dashboard.lock.sectionName')}</DashboardSubTitle>
        <DashboardDeviceGrid>
            <DashboardGridColumnHeader>{t('dashboard.lock.header.label')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.lock.header.deviceId')}</DashboardGridColumnHeader>
            <DashboardGridColumnHeader>{t('dashboard.lock.header.value')}</DashboardGridColumnHeader>
            {dashboardData && dashboardData.locks?.map(s => (<React.Fragment key={`locks-${s.deviceId}`}>
                <span>{s.label}</span>
                <span>{s.deviceId}</span>
                <span>{s.value}</span>
            </React.Fragment>))}
        </DashboardDeviceGrid>
        </>
    )
}

export interface IDashboardProps {
    installedAppId: string;
}

export default Dashboard;