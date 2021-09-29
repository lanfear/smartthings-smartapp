import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IDevice } from "../types/smartthingsExtensions";

const DeviceContainer = styled.div`
    display: flex;
    flex: 1;
    display: column;
    border: 1px solid cyan;
    border-radius: 4px;
`;

const Device: React.FC<IDeviceProps> = ({device}) => {
    const {t} = useTranslation();

    console.log('d', device);

    return (<DeviceContainer>
        <span>{t('dashboard.switch.header.label')}: {device.label}</span>
        <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span>
        <span>{t('dashboard.switch.header.value')}: {device.value}</span>
    </DeviceContainer>);
};

export interface IDeviceProps {
    device: IDevice;
};

export default Device;