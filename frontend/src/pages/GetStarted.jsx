import React, { useState } from "react";
import { Button, Stack } from "@mui/material";
import Authentication from "./Authentication";
import SignUpAuthentication from "./SignUpAuthentication";

const GetStarted = () => {
  const [login, setLogin] = useState(true);

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ mt: 3 }}
      >
        <Button
          variant={login ? "contained" : "outlined"}
          onClick={() => setLogin(true)}
          sx={{
            backgroundColor: login ? "#FF6B00" : "",
            "&:hover": {
              backgroundColor: "#E65C00",
            },
          }}
        >
          Login
        </Button>

        <Button
          variant={!login ? "contained" : "outlined"}
          onClick={() => setLogin(false)}
          sx={{
            backgroundColor: !login ? "#FF6B00" : "",
            "&:hover": {
              backgroundColor: "#E65C00",
            },
          }}
        >
          Sign Up
        </Button>
      </Stack>

      {login ? (
        <Authentication changePage={() => setLogin(false)} />
      ) : (
        <SignUpAuthentication changePage={() => setLogin(true)} />
      )}
    </>
  );
};

export default GetStarted;