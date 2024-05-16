import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroBox,
  ViroTrackingReason,
  ViroTrackingStateConstants,
} from "@viro-community/react-viro";
import React, { useEffect, useState } from "react";
import { PermissionsAndroid, StyleSheet } from "react-native";
import CompassHeading from "react-native-compass-heading";
import Geolocation, { GeoPosition } from "react-native-geolocation-service";

async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Geolocation Permission",
        message: "Can we access your location?",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    console.log("granted", granted);
    if (granted === "granted") {
      console.log("You can use Geolocation");
      return true;
    } else {
      console.log("You cannot use Geolocation");
      return false;
    }
  } catch (e) {
    return false;
  }
}

const HelloWorldSceneAR = () => {
  const [heading, setHeading] = useState<number | null>(null);
  const [initialHeading, setInitialHeading] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<GeoPosition | null>(null);

  type RelativePosition = { x: number; z: number };

  const DEGREES_TO_RADIANS_CONVERSION = (2 * Math.PI) / 360;
  const QUEENS_HOTEL_COORDS = { latitude: 53.796, longitude: -1.548 };
  const TOWN_HALL_COORDS = { latitude: 53.8, longitude: -1.55 };
  const BANK_HOUSE_COORDS = { latitude: 53.7974, longitude: -1.5494 };

  let relativePositionOfQueensHotel: RelativePosition | null = null;
  let relativePositionOfTownHall: RelativePosition | null = null;
  let relativePositionOfBankHouse: RelativePosition | null = null;

  try {
    relativePositionOfQueensHotel = getRelativePosition(QUEENS_HOTEL_COORDS);
    relativePositionOfTownHall = getRelativePosition(TOWN_HALL_COORDS);
    relativePositionOfBankHouse = getRelativePosition(BANK_HOUSE_COORDS);
  } catch (e) {
    console.log(e);
  }

  function getRelativePosition(target: { latitude: number; longitude: number }): RelativePosition {
    if (!userLocation) {
      throw new Error("user location not found");
    }

    const RADIUS_OF_EARTH_IN_METRES = 6_371_000;

    const relativeLatitude = userLocation.coords.latitude - target.latitude;
    const relativeZ = relativeLatitude * DEGREES_TO_RADIANS_CONVERSION * RADIUS_OF_EARTH_IN_METRES;

    const relativeLongitude = target.longitude - userLocation.coords.longitude;
    const relativeX =
      relativeLongitude *
      DEGREES_TO_RADIANS_CONVERSION *
      RADIUS_OF_EARTH_IN_METRES *
      Math.cos(userLocation.coords.latitude * DEGREES_TO_RADIANS_CONVERSION);

    return { x: Math.round(relativeX), z: Math.round(relativeZ) };
  }

  function getLocation(): void {
    requestLocationPermission().then((result) => {
      console.log("result is:", result);
      if (result) {
        Geolocation.getCurrentPosition(
          (position) => {
            console.log(position);
            setUserLocation(position);
          },
          (error) => {
            console.log(error.code, error.message);
            setUserLocation(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    });
  }

  useEffect(() => {
    getLocation();

    const DEGREE_UPDATE_RATE = 3;

    CompassHeading.start(DEGREE_UPDATE_RATE, ({ heading, accuracy }) => {
      console.log("Compass Heading: ", heading, accuracy);
      setHeading(heading);
    });

    return () => {
      CompassHeading.stop();
    };
  }, []);

  function onInitialized(state: any, reason: ViroTrackingReason) {
    console.log("onInitialized", state, reason);
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      setInitialHeading(heading);
    }
  }

  function transformPosition(
    [x, y, z]: [number, number, number],
    heading: number
  ): [number, number, number] {
    const headingRadians = heading * DEGREES_TO_RADIANS_CONVERSION;

    return [
      x * Math.cos(headingRadians) + z * Math.sin(headingRadians),
      y,
      -x * Math.sin(headingRadians) + z * Math.cos(headingRadians),
    ];
  }

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      {initialHeading &&
      relativePositionOfQueensHotel &&
      relativePositionOfTownHall &&
      relativePositionOfBankHouse ? (
        <>
          <ViroBox
            height={50}
            length={50}
            width={50}
            position={transformPosition(
              [relativePositionOfQueensHotel.x, 0, relativePositionOfQueensHotel.z],
              initialHeading
            )}
          />
          <ViroBox
            height={50}
            length={50}
            width={50}
            position={transformPosition(
              [relativePositionOfTownHall.x, 0, relativePositionOfTownHall.z],
              initialHeading
            )}
          />
          <ViroBox
            height={50}
            length={50}
            width={50}
            position={transformPosition(
              [relativePositionOfBankHouse.x, 0, relativePositionOfBankHouse.z],
              initialHeading
            )}
          />
        </>
      ) : null}
    </ViroARScene>
  );
};

export default () => {
  return (
    <ViroARSceneNavigator
      autofocus={true}
      initialScene={{
        scene: HelloWorldSceneAR,
      }}
      style={styles.f1}
    />
  );
};

var styles = StyleSheet.create({
  f1: { flex: 1 },
  helloWorldTextStyle: {
    fontFamily: "Arial",
    fontSize: 30,
    color: "#ffffff",
    textAlignVertical: "center",
    textAlign: "center",
  },
});
