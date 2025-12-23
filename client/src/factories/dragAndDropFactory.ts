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
  collect: (monitor: DragSourceMonitor<IDragAndDropItem, IDragAndDropItem>) => IDragMonitor;
}

export interface IDropConfig {
  accept: IDragAndDropType[];
  drop: (item: IDragAndDropItem, monitor: DropTargetMonitor) => Promise<IDragAndDropItem>;
  canDrop?: (item: IDragAndDropItem, monitor: DropTargetMonitor<IDragAndDropItem, IDragAndDropItem>) => boolean;
  collect?: (monitor: DropTargetMonitor<IDragAndDropItem, IDragAndDropItem>) => IDropMonitor;
}

export interface IDragMonitor {
  isDragging: boolean;
}

export interface IDropMonitor {
  hovered: boolean;
  canDrop: boolean;
  isOverCurrent: boolean;
}

export const createDragConfig = (type: IDragAndDropType, dragId: string, displayName: string, subtype?: string): IDragConfig => ({
  type: type,
  item: {
    type: type,
    subtype: subtype,
    id: dragId,
    displayName: displayName
  },
  collect: (monitor: DragSourceMonitor) => ({
    isDragging: monitor.isDragging()
  })
});

export const createDropConfig = (onDrop: (item: IDragAndDropItem, monitor: DropTargetMonitor) => Promise<IDragAndDropItem>, accept?: IDragAndDropType[]): IDropConfig => ({
  accept: accept ?? [IDragAndDropType.App, IDragAndDropType.Device, IDragAndDropType.Power, IDragAndDropType.Rule],
  drop: onDrop,
  canDrop: item => (accept ?? [IDragAndDropType.App, IDragAndDropType.Device, IDragAndDropType.Power, IDragAndDropType.Rule]).some(a => a === item.type),
  collect: collectMonitor => ({
    hovered: collectMonitor.isOver(),
    canDrop: collectMonitor.canDrop(),
    isOverCurrent: collectMonitor.isOver({shallow: true})
  })
});
