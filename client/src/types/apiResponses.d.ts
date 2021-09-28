// could get this from @smartthings/core-sdk but to bring it all in for types
// and nothing really promises contract alignment between smartapp and smartthings api
export interface ISceneResponse {
    sceneId: string,
    sceneName: string,
    sceneIcon: string,
    sceneColor: string,
    locationId: string,
    createdBy: string,
    createdDate: Date,
    lastUpdatedDate: Date,
    lastExecutedDate: Date,
    editable: boolean,
    apiVersion: string

}

export interface IDeviceResponse {
    deviceId: string,
    label: string,
    value: string  // 'on' or 'off'?
}

export interface IRuleResponse {
    name: string,
    actions: object,
    id: string,
    status: string,
    executionLocation: string,
    ownerType: string,
    ownerId: string,
    creator: string,
    dateCreated: Date,
    dateUpdated: Date
}