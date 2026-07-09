import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const features = [
  "High-quality video calls",
  "Secure end-to-end encryption",
  "Real-time chat messaging",
  "Screen sharing support",
  "Unlimited meeting rooms",
];

export default function FeatureCard() {
  return (
    <Box sx={{ minWidth: 320 }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          p: 1,
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
          >
            Why Choose MeetSphere?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={3}
          >
            Everything you need for seamless communication.
          </Typography>

          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <CheckCircleIcon sx={{ color: "green" }} />
              <Typography variant="body1">
                {feature}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}