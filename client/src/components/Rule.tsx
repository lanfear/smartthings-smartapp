import dayjs from 'dayjs';
import React from 'react';
import {useDrag} from 'react-dnd';
import {useTranslation} from 'react-i18next';
import global, {showControlCaptions} from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlLogo, ControlStatus} from '../factories/styleFactory';
import type {IActiveControl} from '../types/interfaces';
import type {IRuleComponentType, Nullable} from '../types/sharedContracts';

const getRuleIcon = (ruleType: IRuleComponentType): '🌞' | '🌚' | '🔀' | '⏳' => ruleType === 'daylight' ? '🌞' : ruleType === 'nightlight' ? '🌚' : ruleType === 'transition' ? '🔀' : '⏳';

// "9:30PM" today, "Tue 9:30PM" on another day
const formatPausedUntil = (epoch: number): string => {
  const at = dayjs(epoch);
  return at.format(at.isSame(dayjs(), 'day') ? 'h:mmA' : 'ddd h:mmA');
};

const Rule: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleActive, isRuleEnabled, pausedUntil, isKeyRule, setActiveDevice, isLinkedActive, isLockedActive}) => {
  const {t} = useTranslation();
  const dragId = `${ruleType.toLowerCase()}-${rulePartId}`;
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Rule, rulePartId, ruleName, ruleType)));
  const iconography = `${isKeyRule ? '🔑' : ''}${isRuleEnabled ? '' : '🚫'}`;
  // while a timed pause runs, its end time replaces the rule's schedule in the caption
  const pausedUntilText = !isRuleEnabled && pausedUntil ? formatPausedUntil(pausedUntil) : null;

  return (
    <ControlContainer
      title={pausedUntilText ? t('dashboard.rule.pausedUntil', {time: pausedUntilText}) : ''}
      ref={node => {
        drag(node);
      }}
      {...collected}
      rgb={isRuleActive ? `${global.palette.control.rgb.rule}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onTouchEnd={() => setActiveDevice(null)}
      isLinkedActive={isLinkedActive}
      isLockedActive={isLockedActive}
    >
      <ControlLogo>
        {getRuleIcon(ruleType)}
      </ControlLogo>
      {showControlCaptions && (
        <ControlStatus>
          {pausedUntilText ? `⏱ ${pausedUntilText}` : time}
        </ControlStatus>
      )}
      {!!iconography && (
        <ControlIcon>
          {iconography}
        </ControlIcon>
      )}
    </ControlContainer>
  );
};

export interface IRuleProps {
  rulePartId: string;
  ruleName: string;
  ruleType: IRuleComponentType;
  time: string;
  isRuleActive: boolean;
  isRuleEnabled: boolean;
  pausedUntil?: Nullable<number>; // epoch ms a timed pause ends
  isKeyRule: boolean;
  setActiveDevice: (value: Nullable<IActiveControl>) => void;
  isLinkedActive?: boolean;
  isLockedActive?: boolean;
}

export default Rule;
