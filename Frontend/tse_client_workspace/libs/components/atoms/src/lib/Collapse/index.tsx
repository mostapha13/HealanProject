import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export function Collapse({ title, children, className, ...props }: any) {
  return (
    <Accordion sx={{ border: 0 }} className={className} {...props}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <span className="font-bold">{title}</span>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>{children}</Typography>
      </AccordionDetails>
    </Accordion>
  );
}
