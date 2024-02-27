import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
} from "@chakra-ui/react";
import { round, sumBy, uniq, uniqBy } from "lodash";
import { BiHelpCircle } from "react-icons/bi";
import {
  Bar,
  BarChart,
  LabelList,
  LabelProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiResponse, TripData, TripName } from "../types";
import { Trip, formatResponse } from "../utils";

interface ChartProps {
  response?: ApiResponse;
}

export function Chart({ response }: ChartProps) {
  const breakpoint = useBreakpoint();

  if (!response) return null;

  const trips: TripData[] = [
    ...JSON.parse(response.data.my_trip ?? {}),
    ...(response.data.direct_trip ? JSON.parse(response.data.direct_trip) : []),
    ...(response.data.alternative_trip
      ? JSON.parse(response.data.alternative_trip)
      : []),
  ];
  const newTrips = formatResponse(response);

  console.log("hello", uniqBy(trips, "NAME"));

  return (
    <Box h="100%" w="100%">
      <Flex
        align="center"
        color="#595959"
        fontSize={["small", "large"]}
        textAlign="center"
        justifyContent="center"
        marginBottom={3}
      >
        <h2 style={{ marginRight: "8px" }}>
          {response.data.alternative_trip
            ? "Your trip VS other trip"
            : "Your trip VS other means of transport"}
        </h2>
        <ChakraTooltip label="Emissions of nitrogen oxides (NOx), water vapour and soot, combined with the formation of contrails, affect the properties of the atmosphere and lead to an increase in radiative forcing.">
          <span>
            <BiHelpCircle />
          </span>
        </ChakraTooltip>
      </Flex>
      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 350}
        width="100%"
      >
        <BarChart data={getChartData(newTrips)} margin={{ bottom: 20 }}>
          <XAxis
            dataKey="displayedName"
            fontSize={breakpoint === "base" ? 10 : 14}
          />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip formatter={(value) => `${round(+value, 1)} kgCO2eq`} />
          {trips.map((trip) => (
            <Bar
              key={trip.NAME}
              dataKey={trip.NAME}
              fill={trip.colors}
              stackId="a"
            >
              <LabelList
                dataKey="name"
                content={<CustomLabel trips={trips} tripName={trip.NAME} />}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 350}
        width="100%"
      >
        <BarChart data={getChartData(newTrips)} margin={{ bottom: 20 }}>
          <XAxis
            dataKey="displayedName"
            fontSize={breakpoint === "base" ? 10 : 14}
          />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip formatter={(value) => `${round(+value, 1)} kgCO2eq`} />
          {Object.keys(newTrips).map((tripName) => {
            const trip = newTrips[tripName as TripName];
            return trip.steps.map((tripStep, index) => {
              const tripStepName = tripStep.details ?? tripStep.transportMean;
              const isLastStep = index === trip.steps.length - 1;
              console.log({ isLastStep, tripStepName });
              return (
                <Bar
                  key={`${tripName}-${tripStepName}`}
                  dataKey={tripStepName}
                  fill={tripStep.color}
                  stackId="a"
                >
                  {isLastStep && (
                    <LabelList
                      dataKey="name"
                      content={
                        <CustomLabelBis trip={trip} tripName={tripStepName} />
                      }
                    />
                  )}
                </Bar>
              );
            });
          })}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function getChartData(trips: Record<TripName, Trip>) {
  return Object.keys(trips).map((tripName) => {
    const trip = trips[tripName as TripName];
    const steps = trip.steps.reduce((result, step) => {
      const stepName = step.details ?? step.transportMean;
      const test = { ...result, [stepName]: step.kgCO2eq };
      return test;
    }, {} as Record<string, number>);
    return {
      name: tripName,
      displayedName: tripName === "Alternative" ? "Other" : tripName,
      ...steps,
    };
  });
}

interface CustomLabelProps extends LabelProps {
  trips: TripData[];
  tripName: string;
}

const CustomLabel = ({ trips, tripName, ...props }: CustomLabelProps) => {
  const breakpoint = useBreakpoint();
  const currentTrips = trips.filter(
    (trip) => trip["Mean of Transport"] === props.value
  );
  const total = sumBy(currentTrips, "kgCO2eq");
  const shouldDisplay = currentTrips[currentTrips.length - 1].NAME === tripName;

  if (!shouldDisplay) return null;

  return (
    <>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(total)}
      </text>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 8 : 12}
      >
        kgCO2eq
      </text>
    </>
  );
};

const CustomLabelBis = ({
  trip,
  tripName,
  ...props
}: {
  trip: Trip;
  tripName: string;
} & LabelProps) => {
  const breakpoint = useBreakpoint();

  const total = sumBy(trip.steps, "kgCO2eq");
  console.log({ tripName, firstStep: trip.steps[0] });

  if (tripName !== "Plane") return null;

  return (
    <>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(total)}
      </text>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 8 : 12}
      >
        kgCO2eq
      </text>
    </>
  );
};
