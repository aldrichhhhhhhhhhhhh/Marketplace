
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { LocationMapProps } from './LocationMap.types';

const DEFAULT_POINT = {
  latitude: 14.5995,
  longitude: 120.9842,
};

export default function LocationMap({
  point,
  onPick,
}: LocationMapProps) {
  const center = point ?? DEFAULT_POINT;

  return (
    <View style={styles.container}>
      <MapView
        key={`${center.latitude.toFixed(5)}-${center.longitude.toFixed(5)}`}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...center,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        onPress={(event) => {
          onPick(event.nativeEvent.coordinate);
        }}
        onMapReady={() => {
          console.log('SELLSPACE MAP READY');
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {point && (
          <Marker
            coordinate={point}
            title="Selected listing location"
            draggable
            onDragEnd={(event) => {
              onPick(event.nativeEvent.coordinate);
            }}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
