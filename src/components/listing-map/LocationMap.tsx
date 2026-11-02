import { Platform } from 'react-native';
import type { LocationMapProps } from './LocationMap.types';

export type { LocationMapProps, MapPoint } from './LocationMap.types';

const LocationMap = Platform.select({
  android: () => require('./LocationMap.android').default,
  web: () => require('./LocationMap.web').default,
});

export default LocationMap as React.ComponentType<LocationMapProps>;