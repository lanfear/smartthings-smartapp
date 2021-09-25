// Basic templates
import and from "./templates/and.json";
import between from "./templates/between.json";
import command from "./templates/command.json";
import dropsBelow from "./templates/dropsBelow.json";
import dropsToOrBelow from "./templates/dropsToOrBelow.json";
import ifElse from "./templates/ifElse.json";
import ifGreaterThan from "./templates/ifGreaterThan.json";
import ifGreaterThanOrEquals from "./templates/ifGreaterThanOrEquals.json";
import ifNot from "./templates/ifNot.json";
import lessThan from "./templates/lessThan.json";
import lessThanOrEquals from "./templates/lessThanOrEquals.json";
import or from "./templates/or.json";
import risesAbove from "./templates/risesAbove.json";
import risesToOrAbove from "./templates/risesToOrAbove.json";
import setLocationMode from "./templates/setLocationMode.json";
// Advanced templates
import daylightRoutine from "./templates/daylightRoutine.json";
import daylightRoutineDelayed from "./templates/daylightRoutineDelayed.json";
import delayedCommand from "./templates/delayedCommand.json";
import nestedIf from "./templates/nestedIf.json";
import morningSchedule from "./templates/morningSchedule.json";


const BasicTemp = [
  { label: "And operator", value: and },
  { label: "Between", value: between },
  { label: "Command", value: command },
  { label: "Drops Below", value: dropsBelow },
  { label: "Drops To Or Below", value: dropsToOrBelow },
  { label: "If Else", value: ifElse },
  { label: "If Greater Than", value: ifGreaterThan },
  { label: "If Greater Than or Equals", value: ifGreaterThanOrEquals },
  { label: "If less Than", value: lessThan },
  { label: "If less Than or Equals", value: lessThanOrEquals },
  { label: "If Not", value: ifNot },
  { label: "Or operator", value: or },
  { label: "Rises Above", value: risesAbove },
  { label: "Rises To Or Above", value: risesToOrAbove },
  { label: "Set Location Mode", value: setLocationMode },
];

const AdvancedTemp = [
  { label: "Daylight Routine", value: daylightRoutine },
  { label: "Daylight Routine Delayed", value: daylightRoutineDelayed },
  { label: "Delayed command", value: delayedCommand },
  { label: "Nested If Condition", value: nestedIf },
  { label: "Morning Routine At Location", value: morningSchedule },
];


export {
  BasicTemp,
  AdvancedTemp
};
