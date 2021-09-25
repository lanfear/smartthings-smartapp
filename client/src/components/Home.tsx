import React from "react";
import "../App.scss";


function Home() {
	return (
		<div>	
			<div className="text">
				<p> Rules are lightweight automations that run on the <em>SmartThings
					Cloud</em>.
				<br/>
				<br/>


				A rule is defined in JSON format and contains a name, install source, and a list of actions.
				A single rule can be used to contain multiple actions within it. These actions represent a
				tree that is evaluated when the rule is triggered. This <strong><em>Rule Helper </em></strong>
				is a lightweight, local React application to demonstrate the structure and syntax of Rules so
				that you can begin creating your own.

				<br />
				<br />
				This tool is targeted at developers and is designed to be a jumping off point to start creating your own rule builder app or
				create a tool that will allow the installation of a rule into an endusers account. By adding addtional SmartThings APIs, one could
				easily extend this app to allow the selection of devices for templated rules and beyond.
				<br />
				<br />
				<strong>Benefits of Rules:</strong>
					<li>Based on the JSON format, which is easy to understand and dynamically create.</li>
					<li>Control flow statements and context managers are very intuitive.</li>
					<li>Rules can be as complex as your creativity will allow.</li>
				<br />
				<strong>About the Rule Helper:</strong><br />
				This demonstration is divided in 3 components.

				<li><strong><em>Rule Examples</em></strong> - Templates of the most popular legacy Groovy SmartApps
				converted to the new Rules JSON format.</li>
				<li><strong><em>Basic Templates</em></strong> - Sample for different Actions using the various
				Conditions, Operations, and Operands you can use in a Rule.</li>
				<li><strong><em>Advanced Templates</em></strong> - Combines elements presented by <em>Basic
				Templates</em> to demonstrate the flexibility of nested Conditions and concatenated Actions.</li>
				<br />
				<em><strong>Note</strong>: For further information about installing and managing Rules,
				visit the <a href="https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createRule">Rules API.</a></em>
				</p>
				<br></br>
			</div>
		</div>
	)
};


export default Home;

