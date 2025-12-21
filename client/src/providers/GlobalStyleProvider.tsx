import {createGlobalStyle} from 'styled-components';
// import 'bulma/css/bulma.css';
import '../styles/index.css';
import '../styles/animations.css';

export const GlobalStyles = createGlobalStyle`
  :root {
    --border-radius-small: 4px;
    --border-radius: 8px;

    --navbar-height: 100px;
    --navbar-item-padding: 10px;
    --navbar-item-border-radius: var(--border-radius);

    .modal {
      --bulma-modal-content-width: 90vw;
    }

    --navbar-focus-gradient: radial-gradient(
      ellipse at center,
      rgba(110, 255, 185, 1) 0%,
      rgba(110, 255, 185, 0) 100%
    );

    --navbar-focus-gradient-2: conic-gradient(from 240deg at 50% 50%,
      #00ffc3,
      #00fad9,
      #00f4f0,
      #00eeff,
      #00e6ff,
      #00dcff,
      #00d2ff,
      #00c5ff,
      #00b8ff,
      #6da8ff,
      #9f97ff,
      #c285ff);

    --grid-room-border: 1px solid gray;
    --grid-room-border-radius: var(--border-radius-small);
  }

  // Style

  body {
    max-width: 100vw;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  #root {
    max-width: 100vw;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .title {
      align-items: center;
      align-content: center;
  }

  .main-content {
      max-height: calc(100vh - var(--navbar-height));
      display: flex;
      flex-direction: column;
  }

  .text{
      font-size: 17px;
  }
  .left-menu {
      height: 800px;
      overflow-x: hidden;
      overflow-y: auto;
  }

  .button {
      margin: 3px;
      margin-left: 30px;
      width: 90%;
      border-width: 1px;
  }

  .button:hover {
      background-color: #896f84;
      color: #faf5f8;
      border-color: #896f84;
  }

  .button:focus {
      background-color: #896f84;
      color: #faf5f8;
      border-color: #896f84;
  }

  // React Ace Editor
  #textarea {
      margin-left: 37px;
  }

  // #welcomeMessage figcaption h1 b a:hover svg {
  //   filter: grayscale(0%) brightness(1);
  //   transition: all 200ms ease-in-out;
  // }

  // #welcomeMessage figcaption h1 b a:focus svg {
  //   filter: grayscale(0%) brightness(1);
  //   transform: rotateY(-180deg) scale(0.9);
  //   transition: all 70ms linear;
  // }

  .flex-column-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .flex-row-center {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  nav.navbar {
    height: var(--navbar-height);
    padding: 0 100px;
    background: rgba(255, 255, 255, .1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    background-color: rgba(110, 255, 185, 0.25);
    border-bottom: 2px solid rgba(255, 255, 255, .2);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .4), transparent);
      transition: .5s;
    }

    &:hover::before {
      left: 100%;
    }
  }

  .navbar-item {
    padding: var(--navbar-item-padding);
    border-radius: var(--navbar-item-border-radius);
    font-size: 18px;
    transition: .3s;
    color: #536f56;

    &:focus {
      /* position: absolute;
      width: calc(100% + 0.05em);
      height: calc(100% + 0.05em); */
      background: var(--navbar-focus-gradient);
      border-radius: 0.3em;
      content: "";
      /* animation: spinny 5s linear infinite; */
    }

    &:hover {
      text-shadow:
        0px 0px 2px rgba(220, 255, 240, 0.99),
        0px 0px 4px rgba(180, 255, 220, 0.99);
      border-color: rgba(110, 255, 185, 0.4);
      box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.4) inset,
        0 2px 6px rgba(0, 0, 0, 0.5),
        0 10px rgba(0, 0, 0, 0.05) inset,
        0 0px 5px 2px rgba(110, 255, 185, 0.75),
        0 0px 10px 2px rgba(110, 255, 185, 0.75) inset;
    }

    &:active {
      text-shadow:
        0 0 2px rgba(220, 255, 240, 0.99),
        0 0 4px rgba(180, 255, 220, 0.99);
      border-color: rgba(110, 255, 185, 0.6);
      border-style: solid;
      border-width: 1px;
      box-shadow:
        0 1px 0 0 rgba(110, 255, 185, 0.4) inset,
        0 10px 0 0 rgba(110, 255, 185, 0.5) inset,
        0 0 5px 2px rgba(110, 255, 185, 0.75),
        0 0 10px 2px rgba(110, 255, 185, 0.75) inset;
      background: var(--navbar-focus-gradient);
    }
  }

`;

/* old stuff from sass + bulma
@charset "utf-8";

// Import a Google Font
@import url('https://fonts.googleapis.com/css?family=Nunito:400,700');

// Set your brand colors
$purple: #8a4d76;
$pink: #fa7c91;
$brown: #757763;
$beige-light: #d0d1cd;
$beige-lighter: #eff0eb;

// Update Bulma's global variables
$family-sans-serif: 'Nunito', sans-serif;
$grey-dark: $brown;
$grey-light: $beige-light;
$primary: $purple;
$link: $pink;
$widescreen-enabled: true;
$fullhd-enabled: true;

// Update some of Bulma's component variables
$body-background-color: $beige-lighter;
$control-border-width: 2px;
$input-border-color: transparent;
$input-shadow: none;
$bulma-modal-content-width: 90vw;

:root {
  --bulma-modal-content-width: 90vw;
}

// Import only what you need from Bulma
// @import '../node_modules/bulma/sass/utilities/_index.scss';
// @import '../node_modules/bulma/sass/base/_index.scss';
// @import '../node_modules/bulma/sass/elements/box.scss';
// @import '../node_modules/bulma/sass/elements/button.scss';
// @import '../node_modules/bulma/sass/elements/content.scss';
// @import '../node_modules/bulma/sass/form/_index.scss';
// @import '../node_modules/bulma/sass/elements/title.scss';
// @import '../node_modules/bulma/sass/components/modal.scss';
// @import '../node_modules/bulma/sass/components/navbar.scss';
// @import '../node_modules/bulma/sass/layout/hero.scss';
// @import '../node_modules/bulma/sass/layout/section.scss';
// @import '../node_modules/bulma/sass/grid/columns.scss';
// @import '../node_modules/bulma/sass/themes/light.scss';

*/
