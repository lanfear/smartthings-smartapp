import type {Rule, RuleRequest} from '@smartthings/core-sdk';
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {generateActionSwitchLevel, generateConditionBetween, generateConditionMotion} from '../factories/ruleFactory';
import getInstalledSmartApp, {type IResponseSmartApp} from '../operations/getInstalledSmartApp';
import getInstalledSmartApps, {type IResponseSmartApps} from '../operations/getInstalledSmartApps';

const SmartAppGrid = styled.div`
    display: grid;
    grid-template-columns: 3fr repeat(3, 1fr);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

interface ISmartAppData {
  [isaId: string]: IResponseSmartApp;
}

const SmartApps: React.FC<SmartAppProps> = () => {
  const {t} = useTranslation();

  const [smartApps, setSmartApps] = useState<IResponseSmartApps>([]);
  const [smartAppData, setSmartAppData] = useState<ISmartAppData>({});

  const betweenCondition = generateConditionBetween(parseInt(process.env.SMARTAPP_BUILDTIME_RULE_START_TIME_OFFSET ?? '', 10), parseInt(process.env.SMARTAPP_BUILDTIME_RULE_END_TIME_OFFSET ?? '', 10));
  const motionCondition = generateConditionMotion(process.env.SMARTAPP_BUILDTIME_RULE_MOTION_DEVICEID ?? '');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const switchAction = generateActionSwitchLevel(process.env.SMARTAPP_BUILDTIME_RULE_SWITCH_DEVICEID ?? '', 75);
  const newRule: RuleRequest = {
    name: 'Motion Family Room',
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

  const addRule = async (isaId: string): Promise<Rule> => {
    const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/${isaId}/rule`, {
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
    const getSmartApps = async (): Promise<void> => {
      setSmartApps(await getInstalledSmartApps());
    };

    void getSmartApps();
  }, []);

  useEffect(() => {
    const getSmartApp = async (isaId: string): Promise<void> => {
      const updatedSmartAppData = Object.assign([], smartAppData);
      updatedSmartAppData[isaId] = await getInstalledSmartApp(isaId);
      setSmartAppData(updatedSmartAppData);
    };

    // TODO: this is dumb, do them in batch or something
    smartApps.forEach(sa => {
      void getSmartApp(sa);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartApps]); // ignore smartAppData

  return (
    <SmartAppGrid>
      {Object.values(smartAppData).map(sa => (
        <>
          <Link to={`/dashboard/${sa.installedAppId}`}>
            <div>
              {t('smartapp.label')}
              :
              {' '}
              {sa.installedAppId}
            </div>
            <div>
              {t('smartapp.sceneCount')}
              :
              {' '}
              {sa.scenes.length}
            </div>
            <div>
              {t('smartapp.switchCount')}
              :
              {' '}
              {sa.switches.length}
            </div>
            <div>
              {t('smartapp.lockCount')}
              :
              {' '}
              {sa.locks.length}
            </div>
            <div>
              {t('smartapp.motionCount')}
              :
              {' '}
              {sa.motion.length}
            </div>
          </Link>
          <button onClick={() => addRule(sa.installedAppId)}>
            Add The Rule
          </button>
        </>
      ))}
    </SmartAppGrid>
  );
};

export interface SmartAppProps {
}

export default SmartApps;
