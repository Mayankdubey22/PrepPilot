import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { signupUser } from "../../services/auth.service";

import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!formData.password) {
      newErrors.password = "Please create a password.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await signupUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      setErrors({
        submit:
          result.data?.message ||
          "Unable to create your account.",
      });

      return;
    }

    navigate("/signin");
  };

  return (
    <AuthLayout quote="Practice today, get your dream job tomorrow.">
      <div>
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Start your journey toward becoming interview-ready.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-7 space-y-2">
          {[
            "AI-powered mock interviews",
            "Personalized preparation plan",
            "Resume analysis",
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-sm text-[var(--muted)]"
            >
              <CheckCircle2
                size={16}
                className="shrink-0 text-[var(--accent)]"
              />

              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Full Name"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          {errors.submit && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
          >
            Create Account
            <ArrowRight size={18} />
          </Button>
        </form>

        {/* Login link */}
        <p className="mt-7 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Sign In
          </Link>
        </p>

        <p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]">
          By creating an account, you agree to our terms and
          acknowledge our privacy policy.
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;