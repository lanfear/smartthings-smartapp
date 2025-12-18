import {createGlobalStyle} from 'styled-components';
import 'bulma/css/bulma.css';
import '../styles/index.css';
import '../styles/animations.css';

export const GlobalStyles = createGlobalStyle`
  :root {
    .modal {
      --bulma-modal-content-width: 90vw;
    }

    --navbar-focus-gradient: conic-gradient(from 240deg at 50% 50%,
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
  }

  // Style

  .title {
      align-items: center;
      align-content: center;
  }

  .main-content {
      padding-top: 25px;
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
      border-color: transparentize($color: #896f84, $amount: 0);

  }

  .button:focus {
      background-color: #896f84;
      color: #faf5f8;
      border-color: transparentize($color: #896f84, $amount: 0);

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


  nav.navbar {
    // position: fixed;
    // top: 0;
    // left: 0;
    width: 100%;
    padding: 20px 100px;
    background: rgba(255, 255, 255, .1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
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

      &:hover {
        left: 100%;
      }
    }

    .navbar-item {
      // color: #fff;
      font-size: 18px;
      // text-decoration: none;
      // margin-left: 35px;
      transition: .3s;
      // botton1 above, button2 below
      //color: rgba(180, 255, 220, 0.99);
      color: #536f56;
      background-color: rgba(110, 255, 185, 0.25);

      &:focus {
        /* position: absolute;
        width: calc(100% + 0.05em);
        height: calc(100% + 0.05em); */
        background: var(--navbar-focus-gradient);
        border-radius: 0.3em;
        content: "";
        z-index: -2;
        /* animation: spinny 5s linear infinite; */
      }

      &:hover {
        // color: rgba(220, 255, 240, 0.99);
        text-shadow: 0px 0px 2px rgba(220, 255, 240, 0.99), 0px 0px 4px rgba(180, 255, 220, 0.99);
        border-color: rgba(110, 255, 185, 0.4);
        box-shadow:
          0 1px 0 0 rgba(255, 255, 255, 0.4) inset,
          0 2px 6px rgba(0, 0, 0, 0.5),
          0 10px rgba(0, 0, 0, 0.05) inset,
          0 0px 5px 2px rgba(110, 255, 185, 0.75),
          0 0px 10px 2px rgba(110, 255, 185, 0.75) inset;
      }

      &:active {
        //color: rgba(220, 255, 240, 0.99);
        text-shadow: 0px 0px 2px rgba(220, 255, 240, 0.99), 0px 0px 4px rgba(180, 255, 220, 0.99);

        border-color: rgba(110, 255, 185, 0.6) !important;
        border-image: none;
        border-style: solid;
        border-width: 1px;

        box-shadow:
          0 1px 0 0 rgba(110, 255, 185, 0.4) inset,
          0 10px 0 0 rgba(110, 255, 185, 0.5) inset,
          0 0 5px 2px rgba(110, 255, 185, 0.75),
          0 0 10px 2px rgba(110, 255, 185, 0.75) inset !important;

        // background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPHJhZGlhbEdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNzUlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2ZWZmYjkiIHN0b3Atb3BhY2l0eT0iMSIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNmVmZmI5IiBzdG9wLW9wYWNpdHk9IjAiLz4KICA8L3JhZGlhbEdyYWRpZW50PgogIDxyZWN0IHg9Ii01MCIgeT0iLTUwIiB3aWR0aD0iMTAxIiBoZWlnaHQ9IjEwMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);
        // background: -moz-radial-gradient(center, ellipse cover, rgba(110, 255, 185, 1) 0%, rgba(110, 255, 185, 0) 100%);
        // /* FF3.6+ */
        // background: -webkit-gradient(radial, center center, 0px, center center, 100%, color-stop(0%, rgba(110, 255, 185, 1)), color-stop(100%, rgba(110, 255, 185, 0)));
        // /* Chrome,Safari4+ */
        // background: -webkit-radial-gradient(center, ellipse cover, rgba(110, 255, 185, 1) 0%, rgba(110, 255, 185, 0) 100%);
        // /* Chrome10+,Safari5.1+ */
        // background: -o-radial-gradient(center, ellipse cover, rgba(110, 255, 185, 1) 0%, rgba(110, 255, 185, 0) 100%);
        // /* Opera 12+ */
        // background: -ms-radial-gradient(center, ellipse cover, rgba(110, 255, 185, 1) 0%, rgba(110, 255, 185, 0) 100%);
        /* IE10+ */
        /* background: radial-gradient(ellipse at center, rgba(110, 255, 185, 1) 0%, rgba(110, 255, 185, 0) 100%); */
        /* W3C */
      }
    }
  }

  // .logo {
  //   color: #fff;
  //   font-size: 25px;
  //   text-decoration: none;
  //   font-weight: 600;
  //   cursor: default;
  // }
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
