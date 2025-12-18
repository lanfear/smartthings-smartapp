import React, {useState} from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
// Rules
import Examples from '../templates/ruleExamples';

const RuleExamples: React.FC = () => {
  const [rule, setRule] = useState('{}');
  return (
    <div className="App">
      <div className="container">
        <div className="columns">
          <div className="column">
            <aside className="menu left-menu">
              <ul className="menu-list">
                {Examples.map(r => (
                  <li key={`r-${r.label}`}>
                    <button
                      className="button"
                      onClick={() => setRule(JSON.stringify(r.value, null, 2))}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
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
                editorProps={{$blockScrolling: true}}
                setOptions={{fontSize: 15}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleExamples;
