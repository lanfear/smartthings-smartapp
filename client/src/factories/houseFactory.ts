import type {Nullable} from '../types/sharedContracts';

// house summary helpers for the Home page tiles - everything here leans on this house's naming conventions:
// rooms are 'Floor - Room' ('2F - Playroom', 'B - Hallway'; Garage/Outdoor/General have no floor, see Room.tsx),
// fans are '... Ceiling Fan' (their lights are '... Ceiling Fan Light'), and the current fridge/freezer sensors carry a
// ZS<n> tag ('Environment - Fridge - Kitchen ZS1') - the untagged ones are older sensors they replaced

/** the floor part of a room name, or the whole name for rooms without one (eg. 'Garage') */
export const getFloorName = (roomName: Nullable<string> | undefined): string => {
  const parts = (roomName ?? '').split(' - ');
  return parts.length > 1 ? parts[0] : parts[0] || '—';
};

// numbered floors top-down ('2F' before '1F'), then the basement, then areas without a floor alphabetically
const floorRank = (floor: string): number => {
  const level = /^(\d+)F$/i.exec(floor);
  if (level) {
    return -Number(level[1]);
  }
  return /^B\d*$/i.test(floor) ? 0 : 1;
};

export const compareFloors = (a: string, b: string): number => floorRank(a) - floorRank(b) || a.localeCompare(b);

// the ecobee thermostat sits in the middle of 1F, but its SmartThings room ('General') has no floor - so its reading
// is counted toward this floor's average
export const thermostatFloor = '1F';

export const isFan = (label: string): boolean => /\bfan\b(?!\s*light)/i.test(label);

const applianceTag = /\bZS\d+\b/i;
const appliancePattern = /fridge|freezer|refrigerator|kegerator/i;

export const isApplianceSensor = (label: string): boolean => applianceTag.test(label) && appliancePattern.test(label);

export const isFreezerLabel = (label: string): boolean => /freezer/i.test(label);

/** 'Environment - Fridge - Kitchen ZS1' -> 'Kitchen Fridge', 'Environment - Kegerator - ZS5' -> 'Kegerator' */
export const getApplianceName = (label: string): string => {
  const parts = label.replace(applianceTag, '')
    .split(' - ')
    .map(p => p.trim())
    .filter(p => p && !/^environment$/i.test(p));
  return parts.length ? [...parts].reverse().join(' ') : label;
};

export const getApplianceIcon = (label: string): string => (/kegerator/i.test(label) ? '🍺' : isFreezerLabel(label) ? '🧊' : '🥛');

// above these the appliance gets a warning badge (FDA guidance is 40°F / 0°F - freezers swing a few degrees over 0
// while defrosting, so theirs has some headroom)
const warnAboveF = {fridge: 40, freezer: 10} as const;
const fahrenheitFactor = 1.8;
const fahrenheitOffset = 32;

export const isApplianceTooWarm = (label: string, value: Nullable<number>, unit: Nullable<string>): boolean => {
  if (value === null) {
    return false;
  }
  const fahrenheit = unit === 'C' ? (value * fahrenheitFactor) + fahrenheitOffset : value;
  return fahrenheit > (isFreezerLabel(label) ? warnAboveF.freezer : warnAboveF.fridge);
};
