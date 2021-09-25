# Rule Helper

## Introduction
If you are automating Devices and Connected Services on the SmartThings Cloud and do not want to create a standalone application, creating an _Automations_ is a great place to start. [Rules](https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#tag/rules) are a versatile tool, enabling you to create a wide range of Automations that operate on the SmartThings Platform.

A rule is defined in JSON format and contains a name, install source, and a list of actions. A single rule can be used to contain multiple actions within it. These actions represent a tree that is evaluated when the rule is triggered. This **_Rule Helper_** is a lightweight, local React application to demonstrate the structure and syntax of Rules so that you can begin creating your own.

#### Benefits of Rules

- Based on the JSON format, which is easy to understand and dynamically create.
- Control flow statements and context managers are very intuitive.
- Rules can be as complex as your creativity will allow.

#### About the _Rule Helper_:

This demonstration is divided in 3 components.

- **_Rule Examples_** - Templates of the most popular legacy Groovy SmartApps converted to the new Rules JSON format.
- **_Basic Templates_** - Sample for different Actions using the various Conditions, Operations, and Operands you can use in a Rule.
- **_Advanced Templates_** Combines elements presented by _Basic Templates_ to demonstrate the flexibility of nested Conditions and concatenated Actions.

_**Note**:  For further information about installing and managing Rules, visit the [Rules API reference](https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createRule)_.

---

## Deployment

#### Prerequisites.
1. Latest version of [NodeJS](https://nodejs.org) installed on your computer.
2. [Yarn](https://yarnpkg.com) or [NPM](https://www.npmjs.com/)

#### Installation
This tutorial uses Yarn as package manager. However, you can still use NPM if you prefer. Navigate to your Rule Helper and run the following command to install the app dependencies.

    `cd rule-helper
    yarn install`

#### Build
To run  Rule Helper application execute the following command:

      `yarn start`

After a few seconds, the React application will be automatically deployed at your browser.

---

For more information about the **_Rules API_**, please visit our [Rules Documentation](https://smartthings.developer.samsung.com/docs/rules/overview.html) or share your questions at our [Community forums](https://community.smartthings.com/c/developer-programs).
