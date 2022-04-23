import {DragSourceMonitor, DropTargetMonitor} from 'react-dnd';

export enum IDragAndDropType {
  App = 'app',
  Power = 'power',
  Device = 'device',
  Rule = 'rule'
}

export interface IDragAndDropItem {
  type: IDragAndDropType;
  subtype?: string;
  id: string;
  displayName: string;
}

export interface IDragConfig {
  type: IDragAndDropType;
  item: IDragAndDropItem;
  collect: (monitor: DragSourceMonitor) => { isDragging: boolean };
}

export interface IDropConfig {
  accept: IDragAndDropType[];
  drop: (item: IDragAndDropItem, monitor: DropTargetMonitor) => IDragAndDropItem;
}

export const createDragConfig = (type: IDragAndDropType, dragId: string, displayName: string, subtype?: string): IDragConfig => ({
  type: type,
  item: {
    type: type,
    subtype: subtype,
    id: `${type}-${dragId}`,
    displayName: displayName
  },
  collect: (monitor: DragSourceMonitor) => ({
    isDragging: monitor.isDragging()
  })
});

export const createDropConfig = (onDrop: (item: IDragAndDropItem, monitor: DropTargetMonitor) => IDragAndDropItem, accept?: IDragAndDropType[]): IDropConfig => ({
  accept: accept ?? [IDragAndDropType.App, IDragAndDropType.Device, IDragAndDropType.Power, IDragAndDropType.Rule],
  drop: onDrop
});