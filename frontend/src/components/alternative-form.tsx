import { Button, CircularProgress, Stack } from "@mui/material";
import axios from "axios";
import { useState } from "react";

import { Step } from "../types";
import { API_URL } from "../config";
import { ApiResponse } from "../types";
import { StepField } from "./step-field";
import { formatStepsForApi } from "../utils";

interface AlternativeFormProps {
  isActive: boolean;
  setResponse: (response: ApiResponse) => void;
  stepsProps: {
    values: Step[];
    addStep: () => void;
    removeStep: (index: number) => void;
    updateStep: (index: number, data: Partial<Step>) => void;
  };
  stepsToCompare: Step[];
}

export const AlternativeForm = ({
  isActive,
  setResponse,
  stepsProps,
  stepsToCompare,
}: AlternativeFormProps) => {
  const { values: steps, addStep, removeStep, updateStep } = stepsProps;
  const [isLoading, setIsLoading] = useState(false);

  if (!isActive) return null;

  const handleSubmit = async () => {
    if (steps.length < 2 || steps.some((step) => !step.locationCoords))
      throw new Error("At least one step required");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("mode", "2");
    formData.append(
      "my-trip",
      JSON.stringify(formatStepsForApi(stepsToCompare))
    );
    formData.append(
      "alternative-trip",
      JSON.stringify(formatStepsForApi(steps))
    );
    axios
      .post(API_URL, formData, {
        headers: { "Access-Contol-Allow-Origin": "*" },
      })
      .then((response: ApiResponse) => {
        setResponse(response);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Stack
      sx={{
        padding: 3,
        backgroundColor: "#efefef",
        borderRadius: "0 12px 12px 12px",
        justifyContent: "right",
      }}
    >
      <StepField
        isDeparture
        steps={steps}
        updateStep={updateStep}
        removeStep={removeStep}
        index={1}
      />
      {steps.slice(1).map((step) => (
        <StepField
          key={step.index}
          steps={steps}
          removeStep={removeStep}
          updateStep={updateStep}
          index={step.index}
        />
      ))}
      <Button
        style={{
          padding: 0,
          color: "#b7b7b7",
          marginBottom: 10,
          marginTop: 10,
          textTransform: "none",
          fontFamily: "Montserrat",
          fontWeight: 700,
          fontSize: "16px",
          width: "fit-content",
        }}
        onClick={addStep}
      >
        Add step
      </Button>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{
          borderRadius: "20px",
          padding: 0,
          color: "white",
          backgroundColor: "#0097A7",
          margin: 2,
          textTransform: "none",
          fontFamily: "Montserrat",
          fontWeight: 700,
          fontSize: "16px",
          width: "100%",
          height: "50px",
        }}
      >
        {isLoading ? (
          <CircularProgress style={{ color: "white" }} />
        ) : (
          "Compute emissions"
        )}
      </Button>
    </Stack>
  );
};
