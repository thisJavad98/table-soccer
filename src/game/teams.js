/**
 * Colors matched to real national flags (approx. official / commonly cited hex).
 * `bands`: top→bottom (or outer→inner for ring) for disc painting.
 * `style`: how the disc shows the flag.
 */
export const TEAMS = [
  {
    id: 'canada',
    name: { en: 'Canada', fa: 'کانادا' },
    // Maple Leaf red + white
    primary: '#FF0000',
    secondary: '#FFFFFF',
    accent: '#FF0000',
    style: 'pale',
    bands: ['#FF0000', '#FFFFFF', '#FF0000'],
  },
  {
    id: 'brazil',
    name: { en: 'Brazil', fa: 'برزیل' },
    // Green field, yellow rhombus, blue disc
    primary: '#009C3B',
    secondary: '#FFDF00',
    accent: '#002776',
    style: 'brazil',
    bands: ['#009C3B', '#FFDF00', '#002776'],
  },
  {
    id: 'iran',
    name: { en: 'Iran', fa: 'ایران' },
    // Green / white / red
    primary: '#239F40',
    secondary: '#FFFFFF',
    accent: '#DA0000',
    style: 'tricolor',
    bands: ['#239F40', '#FFFFFF', '#DA0000'],
  },
  {
    id: 'argentina',
    name: { en: 'Argentina', fa: 'آرژانتین' },
    // Celeste / white / celeste + sun
    primary: '#74ACDF',
    secondary: '#FFFFFF',
    accent: '#F6B40E',
    style: 'tricolor',
    bands: ['#74ACDF', '#FFFFFF', '#74ACDF'],
  },
  {
    id: 'germany',
    name: { en: 'Germany', fa: 'آلمان' },
    // Black / red / gold
    primary: '#000000',
    secondary: '#DD0000',
    accent: '#FFCC00',
    style: 'tricolor',
    bands: ['#000000', '#DD0000', '#FFCC00'],
  },
  {
    id: 'france',
    name: { en: 'France', fa: 'فرانسه' },
    // Blue / white / red (vertical on flag; shown as bands on disc)
    primary: '#002395',
    secondary: '#FFFFFF',
    accent: '#ED2939',
    style: 'tricolor-v',
    bands: ['#002395', '#FFFFFF', '#ED2939'],
  },
  {
    id: 'japan',
    name: { en: 'Japan', fa: 'ژاپن' },
    // White field, crimson disc
    primary: '#FFFFFF',
    secondary: '#BC002D',
    accent: '#BC002D',
    style: 'japan',
    bands: ['#FFFFFF', '#BC002D', '#FFFFFF'],
  },
  {
    id: 'spain',
    name: { en: 'Spain', fa: 'اسپانیا' },
    // Red / yellow / red (yellow double width on real flag)
    primary: '#AA151B',
    secondary: '#F1BF00',
    accent: '#AA151B',
    style: 'spain',
    bands: ['#AA151B', '#F1BF00', '#AA151B'],
  },
];

export const BOT_TEAM_ID = 'brazil';

export function getTeam(id) {
  return TEAMS.find((t) => t.id === id) || TEAMS[0];
}
