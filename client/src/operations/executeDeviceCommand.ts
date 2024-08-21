import {Command} from '@smartthings/core-sdk';

export const executeDeviceCommand = async (deviceId: string, capability: string, command: string, component?: string, commandArgs?: (Record<string, unknown> | string | number)[]): Promise<Response> => {
  const commandBody: Command = {
    capability: capability,
    component: component ?? 'main',
    command: command,
    arguments: commandArgs
  };

  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST!}/device/${deviceId}`, {
    method: 'POST',
    body: JSON.stringify(commandBody),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response;
};

export default executeDeviceCommand;
