import React from 'react';
import {Routes, Route, Link} from 'react-router-dom';
import {SWRConfig} from 'swr';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {TouchBackend} from 'react-dnd-touch-backend';
import {isMobile} from 'react-device-detect';
// Components
import StyledComponentProvider from './providers/StyledComponentProvider';
import Home from './components/Home';
import RuleExamples from './components/RuleExamples';
import BasicTemplates from './components/BasicTemplates';
import AdvancedTemplates from './components/AdvancedTemplates';
import SmartApps from './components/SmartApps';
import DashboardRooms from './components/DashboardRooms';
import {EventSourceProvider} from 'react-sse-hooks';
import Locations from './components/Locations';
import LocationDropdown from './components/LocationDropdown';
import DashboardApps from './components/DashboardApps';
import DashboardRules from './components/DashboardRules';
import DashboardScenes from './components/DashboardScenes';
import {useLocationContextStore} from './store/LocationContextStore';

export type RouteParams = Record<string, string> & {
  locationId: string;
};

const App: React.FC = () => {
  const locationId = useLocationContextStore(s => s.locationId);

  return (
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
            <nav className="navbar">
              <div className="navbar-brand">
                <LocationDropdown />
                <Link
                  key="location-rooms"
                  className="navbar-item"
                  to={`/dashboard/${locationId}/rooms`}
                >
                  Rooms
                </Link>
                <Link
                  key="location-scenes"
                  className="navbar-item"
                  to={`/dashboard/${locationId}/scenes`}
                >
                  Scenes
                </Link>
                <Link
                  key="location-rules"
                  className="navbar-item"
                  to={`/dashboard/${locationId}/rules`}
                >
                  Rules
                </Link>
                <Link
                  key="location-apps"
                  className="navbar-item"
                  to={`/dashboard/${locationId}/apps`}
                >
                  Apps
                </Link>
                <Link
                  className="navbar-item"
                  to="/rule-examples"
                >
                  Rule Examples
                </Link>
                <Link
                  className="navbar-item"
                  to="/basic-templates"
                >
                  Basic Templates
                </Link>
                <Link
                  className="navbar-item"
                  to="/advanced-templates"
                >
                  Advanced Templates
                </Link>
                <Link
                  className="navbar-item"
                  to="/smartapps"
                >
                  Debugging (SmartApps)
                </Link>
              </div>
            </nav>
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
                >
                </Route>
                <Route
                  path="dashboard/:locationId/rules"
                  element={(<DashboardRules />)}
                >
                </Route>
                <Route
                  path="dashboard/:locationId/apps"
                  element={(<DashboardApps />)}
                >
                </Route>
              </Routes>
            </section>
          </EventSourceProvider>
        </SWRConfig>
      </DndProvider>
    </StyledComponentProvider>
  );
};

export default App;
