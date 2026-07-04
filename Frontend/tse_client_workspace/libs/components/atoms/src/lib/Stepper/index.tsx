import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { Stepper as AStepper } from '@mui/material';

import './style.scss';

export const Stepper = ({ steps, activeStep }: any) => {
  return (
    <AStepper activeStep={activeStep}>
      {steps.map((label: string) => {
        return (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        );
      })}
    </AStepper>
  );
};
