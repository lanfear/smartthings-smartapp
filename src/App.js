import React from "react";
import { Switch, Route } from "react-router-dom";
import "./App.scss";
// Components
import Home from "./components/Home";
import RuleExamples from "./components/RuleExamples";
import BasicTemplates from "./components/BasicTemplates";
import AdvancedTemplates from "./components/AdvancedTemplates";
import { Link  } from "react-router-dom";

function App() {
  return (
    <div>
      <nav class="navbar ">
        <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item" href="/">
            Rule Helper
          </a>


          <div class="navbar-burger burger" data-target="navMenubd-example">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div id="navMenubd-example" class="navbar-menu">
          <div class="navbar-start">
            <Link className="navbar-item" to="/rule-examples">
                  Rule Examples
            </Link>
            <Link className="navbar-item" to="/basic-templates">
                  Basic Templates
            </Link>
            <Link className="navbar-item" to="/advanced-templates">
                  Advanced Templates
            </Link>
          </div>

          <div class="navbar-end">
            <a class="navbar-item is-hidden-desktop-only" href="https://github.com/jgthms/bulma" target="_blank">
              <span class="icon">
                <i class="fa fa-github"></i>
              </span>
            </a>
          </div>
        </div>
        </div>

      </nav>
      <section className="container main-content">
      <Switch>
        <Route path='/' component={Home} exact/>
        <Route path='/rule-examples' component={RuleExamples} exact/>
        <Route path='/basic-templates' component={BasicTemplates} exact/>
        <Route path='/advanced-templates' component={AdvancedTemplates} exact/>
      </Switch>
      </section>
      
           

    </div>
  );
};

export default App;
