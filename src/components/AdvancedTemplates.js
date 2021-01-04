import { React, useState } from "react";

import ButtonRow from "react-bootstrap/ButtonGroup";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "../App.scss";
// Rule Templates
import { AdvancedTemp } from "../templates/ruleTemplates";

function AdvancedTemplates() {
  const [rule, setRule] = useState("{}");
  return (
    <div className="App">
      <div className="container">
        <div className="columns">
          <div className="column is-one-third">
            <div className="left-menu">
              <div className="block">
                {AdvancedTemp.map((rule) => {
                  return <button className="button" onClick={() => setRule(JSON.stringify(rule.value, null, 2))}>{rule.label}</button>
                })}
              </div>
            </div>
          </div>
          <div className="column">
            <div id="example">
              <AceEditor
              height="800px"
              width="1024px"
              mode="json"
              theme="monokai"
              name="textarea"
              value={rule}
              editorProps={{ $blockScrolling: true }}
	            setOptions={{ fontSize: 15 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default AdvancedTemplates;
