export interface StrategicHub {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export const STRATEGIC_HUBS: StrategicHub[] = [
  { name: 'Washington DC', lat: 38.9072, lon: -77.0369, country: 'US' },
  { name: 'London', lat: 51.5072, lon: -0.1276, country: 'GB' },
  { name: 'Brussels', lat: 50.8503, lon: 4.3517, country: 'BE' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, country: 'RU' },
  { name: 'Kyiv', lat: 50.4501, lon: 30.5234, country: 'UA' },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'TR' },
  { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, country: 'IL' },
  { name: 'Tehran', lat: 35.6892, lon: 51.389, country: 'IR' },
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753, country: 'SA' },
  { name: 'New Delhi', lat: 28.6139, lon: 77.209, country: 'IN' },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'CN' },
  { name: 'Taipei', lat: 25.033, lon: 121.5654, country: 'TW' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'JP' },
  { name: 'Seoul', lat: 37.5665, lon: 126.978, country: 'KR' },
  { name: 'Pyongyang', lat: 39.0392, lon: 125.7625, country: 'KP' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'SG' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' },
  { name: 'Brasilia', lat: -15.7939, lon: -47.8828, country: 'BR' },
  { name: 'Bogota', lat: 4.711, lon: -74.0721, country: 'CO' },
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, country: 'ZA' },
];
