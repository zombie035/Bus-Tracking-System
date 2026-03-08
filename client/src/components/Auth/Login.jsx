// client/src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import WhiteLogin from './WhiteLogin';

const Login = () => {
  // WhiteLogin handles all the logic internally
  return <WhiteLogin />;
};

export default Login;