declare module 'iran-svg-map' {
  const map: {
    label: string;
    viewBox: string;
    locations: Array<{name: string; id: string; path: string}>;
  };
  export default map;
}
