import { ApiResponse, Gdf, Step, Transport, TripData, TripName } from "./types";

export function formatStepsForApi(steps: Step[]) {
  const lon = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.locationCoords![1].toString();
    return jsonResult;
  }, {} as { [key: string]: string });
  const lat = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.locationCoords![0].toString();
    return jsonResult;
  }, {} as { [key: string]: string });
  const transp = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.transportMean ?? "";
    return jsonResult;
  }, {} as { [key: string]: string });
  const nb = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = "1";
    return jsonResult;
  }, {} as { [key: string]: string });
  return { lon, lat, transp, nb };
}

export function checkIsOnMobile() {
  return window.innerWidth < 600;
}

type TripStep = {
  transportMean: Transport;
  kgCO2eq: number;
  color: string;
  details?: string;
};

type TripIntermediate = {
  steps: TripStep[];
  geometry?: { coordinates: number[][]; color: string }[];
};

export type Trip = {
  steps: TripStep[];
  geometry: { coordinates: number[][]; color: string }[];
};

function formatTripStep(tripStep: TripData): null | TripStep {
  switch (tripStep.NAME) {
    case "Bus":
    case "Car":
      return {
        transportMean: tripStep.NAME as Transport,
        kgCO2eq: tripStep.kgCO2eq,
        color: tripStep.colors,
      };
    case "Contrails":
    case "CO2":
      return {
        transportMean: "Plane" as Transport,
        kgCO2eq: tripStep.kgCO2eq,
        color: tripStep.colors,
        details: tripStep.NAME,
      };
    default:
      if (tripStep.NAME.includes("Train")) {
        return {
          transportMean: "Train" as Transport,
          kgCO2eq: tripStep.kgCO2eq,
          color: tripStep.colors,
          details: tripStep.NAME,
        };
      }
      return null;
  }
}

function matchGeometries(
  features: Gdf["features"],
  tripsWithoutGeometry: Record<TripName, TripIntermediate>
) {
  return features.reduce((result, feature) => {
    const geometry = {
      coordinates: feature.geometry.coordinates,
      color: feature.properties.colors,
    };
    switch (feature.properties.colors) {
      // direct trips
      case "#febc78":
        return {
          ...result,
          Train: { ...result["Train"], geometry: [geometry] },
        };
      case "#E69138":
        return {
          ...result,
          Car: { ...result["Car"], geometry: [geometry] },
          Bus: { ...result["Bus"], geometry: [geometry] },
        };
      case "#cd781f":
      case "#B45E06":
        return {
          ...result,
          Plane: { ...result["Plane"], geometry: [geometry] },
        };
      // custom trip
      case "#b3eef5":
      case "#7de4f0":
      case "#4accdb":
      case "#27A4B2":
      case "#148693":
      case "#006773":
        const currentGeometry = result["My trip"].geometry;
        const newGeometry = currentGeometry
          ? [...currentGeometry, geometry]
          : [geometry];
        return {
          ...result,
          "My trip": { ...result["My trip"], geometry: newGeometry },
        };
      // alternative trip
      case "#ffd1d9":
      case "#f9b5c1":
      case "#f299a9":
      case "#ec7d92":
      case "#e5617a":
      case "#df4562":
        const otherTripCurrentGeometry = result["Alternative trip"].geometry;
        const otherTripNewGeometry = otherTripCurrentGeometry
          ? [...otherTripCurrentGeometry, geometry]
          : [geometry];
        return {
          ...result,
          "Alternative trip": {
            ...result["Alternative trip"],
            geometry: otherTripNewGeometry,
          },
        };
      default:
        return result;
    }
  }, tripsWithoutGeometry) as Record<TripName, Trip>;
}

export function formatResponse({ data }: ApiResponse) {
  const features = (JSON.parse(data.gdf) as Gdf).features;
  const trips: TripData[] = [
    ...JSON.parse(data.my_trip ?? {}),
    ...(data.direct_trip ? JSON.parse(data.direct_trip) : []),
    ...(data.alternative_trip ? JSON.parse(data.alternative_trip) : []),
  ];

  const tripsWithoutGeometry = trips.reduce((result, trip) => {
    const tripName = trip["Mean of Transport"];
    const newStep = formatTripStep(trip);
    if (!newStep) return result;

    if (Object.keys(result).includes(tripName)) {
      return {
        ...result,
        [tripName]: { steps: [...result[tripName].steps, newStep] },
      };
    }
    return {
      ...result,
      [tripName]: { steps: [newStep] },
    };
  }, {} as Record<TripName, TripIntermediate>);

  return matchGeometries(features, tripsWithoutGeometry);
}
