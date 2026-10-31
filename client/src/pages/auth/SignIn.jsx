import { useState } from "react";
import { Link, useNavigate } from "react-router";

import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import { signinUser } from "../../services/auth.service";
import { useAuth } from "../../context/useAuth";

const initialForm = {
  email: "",
  password: "",
};

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
      submit: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
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

    setIsLoading(true);

    const result = await signinUser({
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrors({
        submit:
          result.data?.message ||
          "Unable to sign in.",
      });

      return;
    }

    login({
      user: result.data.user,
    });

    navigate("/home");
  };

  return (
    <AuthLayout quote="Confidence comes from preparation.">

      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to continue your interview preparation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={isLoading}
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-[var(--primary)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>

    </AuthLayout>
  );
};

export default SignIn;
