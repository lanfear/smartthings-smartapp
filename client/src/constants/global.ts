// toggle off to experiment with icon-only tiles - hides the status captions (on/off/active, 'power', 'RuleSet',
// rule time ranges) on Device/Power/Rule/SmartApp; device/scene labels are unaffected by this flag.
// the explicit `: boolean` annotation is required, not redundant - a bare `const x = true` keeps the literal
// type `true`, which would trip @typescript-eslint/no-unnecessary-condition at every call site
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const showControlCaptions: boolean = true;

export default {
  rule: {
    default: {
      switchLevelRate: 20
    }
  },
  // side-bar: (3.5rem+0.125rem+0.125rem);
  // room-width = 5x(3.5rem+0.125rem+0.125rem)+6x(0.125rem)
  measurements: {
    dashboardGridGap: '0.625rem',
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
        scene: '24AAE6',
        locked: 'E65E24',
        floor: 'F35506'
      }
    }
  },
  // shared "glass" visual language tokens - reused across GlassPanel/GlassPill/ControlContainer in styleFactory.tsx
  // and the tiles/badges in Room.tsx
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    circle: '50%'
  },
  blur: {
    sm: 'blur(5px)',
    md: 'blur(10px)',
    lg: 'blur(20px) saturate(1.2)'
  },
  transitions: {
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  shadows: {
    panel: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    pill: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
    pillHover: '0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
    badge: '0 3px 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    badgeHover: '0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    tile: '0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    tileHover: '0 6px 20px rgba(0, 0, 0, 0.12), 0 12px 40px rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    tileActive: '0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(31, 38, 135, 0.15)'
  },
  httpStatusCode: {
    notFound: 404
  },
  zIndex: {
    header: 10
  },
  routing: {
    dashboardSegment: 'dashboard'
  }
} as const;
