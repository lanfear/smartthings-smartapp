import React from 'react';
import {Switch, Route, Link} from 'react-router-dom';
import './App.scss';
// Components
import Home from './components/Home';
import RuleExamples from './components/RuleExamples';
import BasicTemplates from './components/BasicTemplates';
import AdvancedTemplates from './components/AdvancedTemplates';
import SmartApps from './components/SmartApps';
import Dashboard from './components/Dashboard';

const App: React.FC = () => (
    <div>
        <nav className="navbar ">
            <div className="container">
                <div className="navbar-brand">
                    <a
                        className="navbar-item"
                        href="/"
                    >
                        Rule Helper
                    </a>


                    <div
                        className="navbar-burger burger"
                        data-target="navMenubd-example"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <div
                    id="navMenubd-example"
                    className="navbar-menu"
                >
                    <div className="navbar-start">
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
                            Installed Apps
                        </Link>
                    </div>

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
            <Switch>
                <Route
                    path="/"
                    component={Home}
                    exact
                />
                <Route
                    path="/rule-examples"
                    component={RuleExamples}
                    exact
                />
                <Route
                    path="/basic-templates"
                    component={BasicTemplates}
                    exact
                />
                <Route
                    path="/advanced-templates"
                    component={AdvancedTemplates}
                    exact
                />
                <Route
                    path="/smartapps"
                    component={SmartApps}
                    exact
                />
                <Route
                    path="/dashboard/:installedAppId"
                    component={Dashboard}
                />
            </Switch>
        </section>
    </div>
);

export default App;
