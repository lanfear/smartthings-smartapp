// eslint-disable-next-line no-redeclare
declare const process: { // it's not already defined because this is a js context, idk why it says it is here
  env: Record<string, string | undefined>;
};
