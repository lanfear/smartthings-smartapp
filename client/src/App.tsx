import React from 'react';
import {isMobile} from 'react-device-detect';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {TouchBackend} from 'react-dnd-touch-backend';
import {Routes, Route} from 'react-router-dom';
// Components
import {EventSourceProvider} from 'react-sse-hooks';
import {SWRConfig} from 'swr';
import AdvancedTemplates from './components/AdvancedTemplates';
import BasicTemplates from './components/BasicTemplates';
import DashboardApps from './components/DashboardApps';
import DashboardRooms from './components/DashboardRooms';
import DashboardRules from './components/DashboardRules';
import DashboardScenes from './components/DashboardScenes';
import Home from './components/Home';
import Locations from './components/Locations';
import NavMenu from './components/NavMenu';
import RuleExamples from './components/RuleExamples';
import SmartApps from './components/SmartApps';
import StyledComponentProvider from './providers/StyledComponentProvider';

export type RouteParams = Record<string, string> & {
  locationId: string;
};

const App: React.FC = () => (
  <StyledComponentProvider>
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <SWRConfig
        value={{
          onSuccess: (d, k) => {
            localStorage.setItem(k, JSON.stringify(d));
          },
          onError: (_, k) => {
            localStorage.removeItem(k);
          }
        }}
      >
        <EventSourceProvider>
          <NavMenu />
          <section className="container main-content">
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="rule-examples"
                element={<RuleExamples />}
              />
              <Route
                path="basic-templates"
                element={<BasicTemplates />}
              />
              <Route
                path="advanced-templates"
                element={<AdvancedTemplates />}
              />
              <Route
                path="smartapps"
                element={<SmartApps />}
              />
              <Route
                path="locations"
                element={<Locations />}
              />
              <Route
                path="dashboard/:locationId/rooms"
                element={<DashboardRooms />}
              />
              <Route
                path="dashboard/:locationId/scenes"
                element={(<DashboardScenes />)}
              />
              <Route
                path="dashboard/:locationId/rules"
                element={(<DashboardRules />)}
              />
              <Route
                path="dashboard/:locationId/apps"
                element={(<DashboardApps />)}
              />
            </Routes>
          </section>
        </EventSourceProvider>
      </SWRConfig>
    </DndProvider>
  </StyledComponentProvider>
);

export default App;
