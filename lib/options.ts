export const LOCATIONS: Record<string, string[]> = {
  Manhattan: [
    'Morningside Heights', 'Harlem', 'Upper West Side', 'Upper East Side', 'Midtown',
    'Times Square', 'Chelsea', 'Greenwich Village', 'SoHo', 'East Village',
    'Lower East Side', 'Financial District', 'Washington Heights',
  ],
  Brooklyn: ['Williamsburg', 'Greenpoint', 'Bushwick', 'DUMBO', 'Brooklyn Heights', 'Park Slope', 'Coney Island'],
  Queens: ['Astoria', 'Long Island City', 'Flushing', 'Jackson Heights'],
  Bronx: ['Riverdale', 'Arthur Avenue', 'Yankee Stadium'],
  'Staten Island': ['St. George'],
}

export function findNeighborhood(name: string) {
  for (const borough of Object.keys(LOCATIONS)) {
    if (LOCATIONS[borough].includes(name)) return { neighborhood: name, borough }
  }
  return null
}