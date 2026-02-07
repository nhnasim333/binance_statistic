import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Register from "../pages/Register";
import Login from "../pages/Login";
import LoginPageRoute from "./LoginPageRoute";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // children: [
    //   {
    //     path: "/",
    //     element: <DashboardManagement />,
    //   },
    // ]
  },
  {
    path: "/register",
    element: (
        <LoginPageRoute>
          <Register />
        </LoginPageRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <LoginPageRoute>
        <Login />
      </LoginPageRoute>
    ),
  },
]);

export default router;
