import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CssBaseline,
  FormControl,
  FormLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const SignUpContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUp({changePage}) {
  const [name, setName] = useState("");
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [response,setresponse]=useState("")
  const [nameError, setNameError] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
 const navigate = useNavigate();
  const validateInputs = () => {
    let valid = true;

    setNameError("");
    setUserNameError("");
    setPasswordError("");

    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    }

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

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!validateInputs()) return;

    const signUpData = {
      name,
      username,
      password,
    };

    console.log(signUpData);
try{
    const res =await axios.post( `${import.meta.env.VITE_BACKEND_URL}/signup`, signUpData, {
    withCredentials: true,
  });
  console.log("Signup response:", res.data);
  console.log("token from server:", res.data.user.token);
   if (res.data.success) {
  setresponse("Signup successful");
  localStorage.setItem("token", res.data.user.token);
    navigate("/home");
} else {
  setresponse(res.data.message);
}
} catch (err) {
      console.error("Signup Error:", err);
    }
  };

  return (
    <>
      <CssBaseline />

      <SignUpContainer>
        <StyledCard>
          <Stack spacing={1} alignItems="center" mb={3}>
            <PersonAddIcon
              sx={{
                fontSize: 55,
                color: "#FF6B00",
              }}
            />

            <Typography variant="h4" fontWeight="bold">
              Create Account
            </Typography>

            <Typography color="text.secondary">
              Join MeetSphere today
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Name</FormLabel>

              <TextField
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={Boolean(nameError)}
                helperText={nameError}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Username</FormLabel>

              <TextField
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                error={Boolean(userNameError)}
                helperText={userNameError}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Password</FormLabel>

              <TextField
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={Boolean(passwordError)}
                helperText={passwordError}
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 2,
                backgroundColor: "#FF6B00",
                "&:hover": {
                  backgroundColor: "#E65C00",
                },
              }}
            >
              Sign Up
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
      </SignUpContainer>
    </>
  );
}