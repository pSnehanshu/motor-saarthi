export enum ContactReasons {
  carblock = 'carblock',
  badpark = 'badpark',
  open = 'open',
  parkelsewhere = 'parkelsewhere',
}

export const ContactReasonsHumanFriendly: Record<ContactReasons, string> = {
  [ContactReasons.carblock]: 'Vehicle is blocking the way',
  [ContactReasons.badpark]: 'Parked in a wrong place',
  [ContactReasons.open]: 'Doors or windows are open',
  [ContactReasons.parkelsewhere]: 'Vehicle should be parked elsewhere',
};
