import {createGlobalStyle} from 'styled-components';
// import 'bulma/css/bulma.css';
import '../styles/index.css';
import '../styles/animations.css';

export const GlobalStyles = createGlobalStyle`
  :root {
    --border-radius-small: 4px;
    --border-radius: 8px;

    --button-padding: 10px;
    --button-border-radius: var(--border-radius);
    --button-focus-gradient: radial-gradient(
      ellipse at center,
      rgba(110, 255, 185, 1) 0%,
      rgba(110, 255, 185, 0) 100%
    );

    --button-focus-gradient-2: conic-gradient(from 240deg at 50% 50%,
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

    --navbar-height: 50px;
    --navbar-item-padding: 10px;
    --navbar-item-border-radius: var(--border-radius);

    .modal {
      --bulma-modal-content-width: 90vw;
    }

    --grid-room-border: 1px solid gray;
    --grid-room-border-radius: var(--border-radius-small);
  }

  // Style

  /* app shell: the page itself never scrolls - the nav stays put and .main-content (or a page's own scroll area) scrolls
     instead. dvh rather than vh because on mobile 100vh includes the space behind the browser's address bar, which pushes
     the bottom of the page off screen. overflow: clip (not hidden) so scrollIntoView can't scroll the shell sideways either */
  html,
  body,
  #root {
    height: 100vh;
    height: 100dvh;
    max-width: 100vw;
  }

  body {
    overflow: clip;
  }

  #root {
    display: flex;
    flex-direction: column;
  }

  .title {
      align-items: center;
      align-content: center;
  }

  /* fills whatever height the nav leaves (the nav wraps to more rows on narrow screens, so it has no fixed height). pages
     with their own scroll area fill it, anything taller scrolls here */
  .main-content {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
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

  .styled-button {
    padding: var(--button-padding);
    border-radius: var(--button-border-radius);
    font-size: 18px;
    transition: .3s;
    color: #536f56;

    &:focus {
      /* position: absolute;
      width: calc(100% + 0.05em);
      height: calc(100% + 0.05em); */
      background: var(--button-focus-gradient);
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
      background: var(--button-focus-gradient);
    }
  }

  nav.navbar {
    position: relative;
    flex: none;
    min-height: var(--navbar-height);
    padding: 0 clamp(8px, 5vw, 100px);
    background: rgba(255, 255, 255, .1);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    background-color: rgba(110, 255, 185, 0.25);
    border-bottom: 2px solid rgba(255, 255, 255, .2);

    /* decorative sweep. it slides the gradient across a fixed overlay rather than moving the overlay itself, which used to
       end up parked off the right edge after a hover (or a tap on mobile) and widen the page */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 33%, rgba(255, 255, 255, .4) 50%, transparent 67%);
      background-size: 300% 100%;
      background-position: 100% 0;
      transition: background-position .5s;
      /* it sits above the nav links, so let clicks pass through to them */
      pointer-events: none;
    }

    &:hover::before {
      background-position: 0 0;
    }

    @media (max-width: 640px) {
      justify-content: center;
      padding: 4px 8px;

      .navbar-item {
        font-size: 15px;
        padding: 6px 8px;
      }
    }
  }

  .navbar-item {
    padding: var(--navbar-item-padding);
    border-radius: var(--navbar-item-border-radius);
    font-size: 18px;
    transition: .3s;
    color: #536f56;
    text-decoration: none;
    white-space: nowrap;

    &:focus,&.selected {
      /* position: absolute;
      width: calc(100% + 0.05em);
      height: calc(100% + 0.05em); */
      background: var(--button-focus-gradient);
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
      background: var(--button-focus-gradient);
    }
  }
`;
