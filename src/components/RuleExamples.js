import { React, useState } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "../App.scss";
// Rules
import Examples from "../templates/ruleExamples";

function RuleExamples() {
  const [rule, setRule] = useState("{}");
  return (
    <div className="App">
      <div className="container">
        <div className="columns">
          <div className="column">
              <aside className="menu left-menu">
                <ul className="menu-list">
                  {Examples.map((rule) => {
                    return <li><button className="button" onClick={() => setRule(JSON.stringify(rule.value, null, 2))}>{rule.label}</button></li>
                  })}
                </ul>
              </aside>
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
  );
};

export default RuleExamples;
