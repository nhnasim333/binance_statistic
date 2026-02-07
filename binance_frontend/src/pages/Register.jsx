import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [userRegister, { isLoading }] = useRegisterMutation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = watch("password");

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const toastId = toast.loading("Creating your account...");

    try {
      const userInfo = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      await userRegister(userInfo).unwrap();

      toast.success("Account created successfully!", { id: toastId, duration: 2000 });
      navigate("/login");
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
            Start Your Journey
          </h1>
          <p className="text-gray-400 text-lg mb-12">
            Join us and get access to real-time cryptocurrency data and advanced analytics
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-[#0ECB81]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Real-time Data</h3>
                <p className="text-gray-400 text-sm">Track 242 tokens with sub-second updates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-[#0ECB81]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">4-Hour Intervals</h3>
                <p className="text-gray-400 text-sm">Advanced charting with custom intervals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-[#0ECB81]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Live Charts</h3>
                <p className="text-gray-400 text-sm">Interactive charts with WebSocket updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 mb-8">
              Sign up to start tracking cryptocurrency prices
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="bg-[#2B3139] border-[#2B3139] text-white placeholder:text-gray-500 focus:border-[#FCD535] focus:ring-[#FCD535] h-12"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-[#F6465D] text-sm">{errors.name.message}</p>
                )}
              </div>

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
                    placeholder="Create a strong password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="bg-[#2B3139] border-[#2B3139] text-white placeholder:text-gray-500 focus:border-[#FCD535] focus:ring-[#FCD535] h-12 pr-12"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === password || "Passwords do not match",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[#F6465D] text-sm">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FCD535] hover:bg-[#E7C32D] text-black font-semibold h-12 text-base mt-6"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-[#FCD535] hover:text-[#E7C32D] font-semibold">
                  Log In
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
