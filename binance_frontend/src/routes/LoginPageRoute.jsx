/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/auth/authSlice";

const LoginPageRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);

  if (user) {
    return <Navigate to="/" />;
  }
  return children;
};

export default LoginPageRoute;
