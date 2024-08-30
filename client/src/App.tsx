import React from 'react';
import {Routes, Route, Link} from 'react-router-dom';
import {SWRConfig} from 'swr';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {TouchBackend} from 'react-dnd-touch-backend';
import {isMobile} from 'react-device-detect';
import './App.scss';
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
import {DeviceContextStore} from './store/DeviceContextStore';
import DashboardApps from './components/DashboardApps';
import DashboardRules from './components/DashboardRules';
import DashboardScenes from './components/DashboardScenes';

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
          <nav className="navbar ">
            <div className="container">
              <div className="navbar-brand">
                <Link
                  className="navbar-item"
                  to="/locations"
                >
                            Locations
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
                <div className="navbar-end">
                  <a
                    className="navbar-item is-hidden-desktop-only"
                    href="https://github.com/jgthms/bulma"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="icon">
                      <i className="fa fa-github"></i>
                    </span>
                  </a>
                </div>
              </div>
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
                element={(
                  <DeviceContextStore locationId="b2f46f0a-a5bf-4265-b206-51fcd14bb58d">
                    <DashboardRooms />
                  </DeviceContextStore>
                )}
              >
              </Route>
              <Route
                path="dashboard/:locationId/scenes"
                element={(
                  <DeviceContextStore locationId="b2f46f0a-a5bf-4265-b206-51fcd14bb58d">
                    <DashboardScenes />
                  </DeviceContextStore>
                )}
              >
              </Route>
              <Route
                path="dashboard/:locationId/rules"
                element={(
                  <DeviceContextStore locationId="b2f46f0a-a5bf-4265-b206-51fcd14bb58d">
                    <DashboardRules />
                  </DeviceContextStore>
                )}
              >
              </Route>
              <Route
                path="dashboard/:locationId/apps"
                element={(
                  <DeviceContextStore locationId="b2f46f0a-a5bf-4265-b206-51fcd14bb58d">
                    <DashboardApps />
                  </DeviceContextStore>
                )}
              >
              </Route>
            </Routes>
          </section>
        </EventSourceProvider>
      </SWRConfig>
    </DndProvider>
  </StyledComponentProvider>
);

export default App;
