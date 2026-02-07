import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { verifyToken } from "@/utils/verifyToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [userLogin, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    const toastId = toast.loading("Logging in...");

    try {
      const userInfo = {
        email: data.email,
        password: data.password,
      };

      const res = await userLogin(userInfo).unwrap();
      const user = verifyToken(res?.data?.accessToken);
      dispatch(setUser({ user, token: res?.data?.accessToken }));

      toast.success("Logged in successfully!", { id: toastId, duration: 2000 });
      navigate("/");
    } catch (error) {
      let message = "Something went wrong!";
      if (error) {
        message = error?.data?.message || error.message;
      }
      toast.error(message, { id: toastId, duration: 2000 });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#181A20] to-[#0B0E11] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#FCD535] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-black">B</span>
              </div>
              <span className="text-3xl font-bold text-white">Binance Stats</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-lg">
            Track real-time cryptocurrency prices and statistics across 242 tokens
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#1E2329] rounded-lg">
              <div className="text-2xl font-bold text-[#FCD535] mb-1">242</div>
              <div className="text-xs text-gray-400">Tokens</div>
            </div>
            <div className="p-4 bg-[#1E2329] rounded-lg">
              <div className="text-2xl font-bold text-[#0ECB81] mb-1">1s</div>
              <div className="text-xs text-gray-400">Updates</div>
            </div>
            <div className="p-4 bg-[#1E2329] rounded-lg">
              <div className="text-2xl font-bold text-[#F6465D] mb-1">4hr</div>
              <div className="text-xs text-gray-400">Intervals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#FCD535] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-black">B</span>
              </div>
              <span className="text-2xl font-bold text-white">Binance Stats</span>
            </div>
          </div>

          <div className="bg-[#1E2329] rounded-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Log In</h2>
            <p className="text-gray-400 mb-8">
              Enter your credentials to access your account
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-[#2B3139] border-[#2B3139] text-white placeholder:text-gray-500 focus:border-[#FCD535] focus:ring-[#FCD535] h-12"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-[#F6465D] text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-[#2B3139] border-[#2B3139] text-white placeholder:text-gray-500 focus:border-[#FCD535] focus:ring-[#FCD535] h-12 pr-12"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#F6465D] text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FCD535] hover:bg-[#E7C32D] text-black font-semibold h-12 text-base"
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="text-[#FCD535] hover:text-[#E7C32D] font-semibold">
                  Register
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
