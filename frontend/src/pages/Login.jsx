import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  CssBaseline,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChatIcon from "@mui/icons-material/Chat";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100vh",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(3),
  background:
    "linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 40%, #FFFFFF 100%)",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 450,
  padding: theme.spacing(4),
  borderRadius: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
}));

export default function Login({ changePage }) {
  const [ username, setUsername ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ userNameError, setUserNameError ] = useState("");
  const [ passwordError, setPasswordError ] = useState("");
  const [ response, setResponse ] = useState("");
  const navigate = useNavigate();
  const validateInputs = () => {
    let valid = true;
    setUserNameError("");
    setPasswordError("");
    if (!username.trim()) {
      setUserNameError("Username is required");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    const loginData = {
      username,
      password,
    };

    console.log("Login Data:", loginData);

    try {
      const res = await axios.post( `${import.meta.env.VITE_BACKEND_URL}/login`, loginData, {
    withCredentials: true,
  })
      if (res.data.success) {
        setResponse("Login successfull");
         localStorage.setItem("token", res.data.user.token);
         navigate("/home");
      } else {
        setResponse(res.data.message);
      }
    } catch (err) {
      console.log("Status:", err.response?.status);
      console.log("Data:", err.response?.data);
      console.log("Headers:", err.response?.headers);

      setResponse(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      <CssBaseline />

      <SignInContainer>
        <StyledCard>
          <Stack spacing={1} alignItems="center" mb={3}>


            <Typography variant="h4" fontWeight="bold">
              MeetSphere
            </Typography>

            <Typography color="text.secondary">
              Welcome Back
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Username</FormLabel>

              <TextField
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Password</FormLabel>

              <TextField
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={Boolean(passwordError)}
                helperText={passwordError}
              />
            </FormControl>

            <FormControlLabel
              control={<Checkbox />}
              label="Remember Me"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 2,
                backgroundColor: "#FF6B00",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#E65C00",
                },
              }}
            >
              Sign In
            </Button>
            {response && (
              <Typography
                color="error"
                textAlign="center"
                sx={{ mt: 2 }}
              >
                {response}
              </Typography>
            )}
          </Box>
        </StyledCard>
      </SignInContainer>
    </>
  );
}