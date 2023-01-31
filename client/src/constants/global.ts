export default {
  rule: {
    default: {
      switchLevelRate: 20
    }
  },
  // notes to improve (move all these to rem, some gaps are in px)
  // grid-gap: 10px
  // devices: 5x3.5rem
  // side-bar: 60px;
  // room-width = 5x(3.5rem+0.125rem+0.125rem)+6x(0.125rem)
  measurements: {
    defaultGridGap: '10px',
    deviceWidth: '3.5rem',
    deviceMargin: '0.125rem',
    deviceGridGap: '0.125rem',
    devicesPerRow: 5,
    controlsContainerWidth: '3.75rem',
    minRoomSize: '19.25rem'
  },
  palette: {
    control: {
      alpha: '66',
      rgb: {
        inactive: 'cccccc',
        power: 'E3E624',
        switch: 'E3E624',
        motion: '32E624',
        rule: 'E68C24',
        app: 'E68C24',
        locked: 'E65E24'
      }
    }
  }
};
