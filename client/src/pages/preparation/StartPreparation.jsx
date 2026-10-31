import { useState } from "react";
import { uploadResume } from "../../services/resume.service";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  FileText,
  GraduationCap,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/useAuth";
import { createPreparation } from "../../services/preparation.service";

const initialForm = {
  targetRole: "",
  experience: "",
  targetCompany: "",
  jobDescription: "",
  interviewTypes: [],
  difficulty: "",
  duration: "",
  dailyTime: "",
  resume: null,
};

const StartPreparation = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiProcessingConsent, setAiProcessingConsent] = useState(false);

  // --------------------------------
  // Handle normal input changes
  // --------------------------------
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

  // --------------------------------
  // Handle interview type selection
  // --------------------------------
  const handleInterviewType = (type) => {
    setFormData((current) => {
      const alreadySelected =
        current.interviewTypes.includes(type);

      return {
        ...current,
        interviewTypes: alreadySelected
          ? current.interviewTypes.filter(
            (item) => item !== type
          )
          : [...current.interviewTypes, type],
      };
    });

    setErrors((current) => ({
      ...current,
      interviewTypes: "",
      submit: "",
    }));
  };

  // --------------------------------
  // Handle resume upload
  // --------------------------------
  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Only PDF
    if (file.type !== "application/pdf") {
      setErrors((current) => ({
        ...current,
        resume: "Please upload a PDF file.",
      }));

      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        resume: "Resume must be smaller than 5 MB.",
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      resume: file,
    }));

    setErrors((current) => ({
      ...current,
      resume: "",
      submit: "",
    }));
  };

  // --------------------------------
  // Validate form
  // --------------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.targetRole.trim()) {
      newErrors.targetRole =
        "Target role is required.";
    }

    if (!formData.experience) {
      newErrors.experience =
        "Please select your experience level.";
    }

    if (formData.interviewTypes.length === 0) {
      newErrors.interviewTypes =
        "Select at least one interview type.";
    }

    if (!formData.difficulty) {
      newErrors.difficulty =
        "Please select a difficulty level.";
    }

    if (!formData.duration) {
      newErrors.duration =
        "Please select your preparation duration.";
    }

    if (!formData.dailyTime) {
      newErrors.dailyTime =
        "Please select your daily study time.";
    }

    if (!formData.resume) {
      newErrors.resume =
        "Please upload your resume.";
    }

    if (!aiProcessingConsent) {
      newErrors.aiProcessingConsent =
        "Please confirm that you agree to AI processing of your resume.";
    }

    return newErrors;
  };

  // --------------------------------
  // Submit preparation
  // --------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!token) {
      setErrors({
        submit: "Your session has expired. Please sign in again.",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Step 1: Upload the resume and extract its text.
      const resumeResult = await uploadResume(
        formData.resume,
      );

      if (!resumeResult.success) {
        setErrors({
          submit:
            resumeResult.data.message ||
            "Resume upload failed. Please try again.",
        });
        return;
      }

      // Step 2: Create the preparation linked to that resume.
      const preparationData = {
        targetRole: formData.targetRole.trim(),
        experience: formData.experience,
        targetCompany: formData.targetCompany.trim(),
        jobDescription: formData.jobDescription.trim(),
        interviewTypes: formData.interviewTypes,
        difficulty: formData.difficulty,
        duration: formData.duration,
        dailyTime: formData.dailyTime,
        resumeId: resumeResult.data.resume.id,
        aiProcessingConsent: aiProcessingConsent,
      };

      const preparationResult = await createPreparation(
        preparationData,
      );

      if (!preparationResult.success) {
        setErrors({
          submit:
            preparationResult.data.message ||
            "Unable to create your preparation. Please try again.",
        });
        return;
      }

      // Both API requests succeeded.
      navigate("/preparation");
    } catch {
      setErrors({
        submit: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8">
        <Link
          to="/home"
          className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div>
          <p className="text-sm font-medium text-[var(--primary)]">
            Build your preparation plan
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Start Preparation
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Tell PrepPilot about your interview goals and
            we'll create a personalized preparation plan
            for you.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* ================================
              MAIN FORM
          ================================= */}

          <div className="col-span-2 space-y-6">
            {/* Target Role */}
            <Card>
              <SectionHeader
                icon={BriefcaseBusiness}
                title="Target Role"
                description="Tell us what position you're preparing for."
              />

              <div className="mt-6">
                <Input
                  label="Target job role"
                  name="targetRole"
                  placeholder="e.g. Frontend Developer"
                  value={formData.targetRole}
                  onChange={handleChange}
                  error={errors.targetRole}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium">
                  Experience level
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    "Fresher",
                    "0-2 Years",
                    "2+ Years",
                  ].map((option) => (
                    <SelectCard
                      key={option}
                      label={option}
                      selected={
                        formData.experience === option
                      }
                      disabled={isSubmitting}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          experience: option,
                        }))
                      }
                    />
                  ))}
                </div>

                {errors.experience && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.experience}
                  </p>
                )}
              </div>
            </Card>

            {/* Target Company */}
            <Card>
              <SectionHeader
                icon={Building2}
                title="Target Company"
                description="Optional information about the company you're targeting."
              />

              <div className="mt-6">
                <Input
                  label="Company name"
                  name="targetCompany"
                  placeholder="e.g. Google, Microsoft, TCS"
                  value={formData.targetCompany}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium">
                  Job description

                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                    Optional
                  </span>
                </label>

                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={7}
                  disabled={isSubmitting}
                  placeholder="Paste the job description here..."
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-[var(--muted)]">
                  PrepPilot can use this to identify skills
                  and topics that are important for the role.
                </p>
              </div>
            </Card>

            {/* Interview Configuration */}
            <Card>
              <SectionHeader
                icon={GraduationCap}
                title="Interview Configuration"
                description="Customize the type and difficulty of your preparation."
              />

              {/* Interview Type */}
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium">
                  Interview type
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    "Technical",
                    "Behavioral",
                    "HR",
                  ].map((type) => (
                    <SelectCard
                      key={type}
                      label={type}
                      selected={formData.interviewTypes.includes(
                        type
                      )}
                      disabled={isSubmitting}
                      onClick={() =>
                        handleInterviewType(type)
                      }
                    />
                  ))}
                </div>

                {errors.interviewTypes && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.interviewTypes}
                  </p>
                )}
              </div>

              {/* Difficulty */}
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium">
                  Difficulty
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    "Beginner",
                    "Intermediate",
                    "Advanced",
                  ].map((option) => (
                    <SelectCard
                      key={option}
                      label={option}
                      selected={
                        formData.difficulty === option
                      }
                      disabled={isSubmitting}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          difficulty: option,
                        }))
                      }
                    />
                  ))}
                </div>

                {errors.difficulty && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.difficulty}
                  </p>
                )}
              </div>
            </Card>

            {/* Preparation Schedule */}
            <Card>
              <SectionHeader
                icon={Clock3}
                title="Preparation Schedule"
                description="Choose a schedule that works for you."
              />

              {/* Duration */}
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium">
                  Preparation duration
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    "7 Days",
                    "14 Days",
                    "21 Days",
                    "30 Days",
                  ].map((option) => (
                    <SelectCard
                      key={option}
                      label={option}
                      selected={
                        formData.duration === option
                      }
                      disabled={isSubmitting}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          duration: option,
                        }))
                      }
                    />
                  ))}
                </div>

                {errors.duration && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.duration}
                  </p>
                )}
              </div>

              {/* Daily Study Time */}
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium">
                  Daily study time
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    "30 min",
                    "1 hour",
                    "2 hours",
                    "3+ hours",
                  ].map((option) => (
                    <SelectCard
                      key={option}
                      label={option}
                      selected={
                        formData.dailyTime === option
                      }
                      disabled={isSubmitting}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          dailyTime: option,
                        }))
                      }
                    />
                  ))}
                </div>

                {errors.dailyTime && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.dailyTime}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* ================================
              SIDEBAR
          ================================= */}

          <div className="space-y-6">
            {/* Resume */}
            <Card>
              <SectionHeader
                icon={FileText}
                title="Resume"
                description="Upload your latest resume."
              />

              <label
                htmlFor="resume"
                className={`
                  mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all
                  ${errors.resume
                    ? "border-red-500 bg-red-500/5"
                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
                  }
                  ${isSubmitting
                    ? "cursor-not-allowed opacity-60"
                    : ""
                  }
                `}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Upload size={22} />
                </div>

                <p className="mt-4 max-w-full truncate text-sm font-medium">
                  {formData.resume
                    ? formData.resume.name
                    : "Upload your resume"}
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  PDF only · Maximum 5 MB
                </p>

                <input
                  id="resume"
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>

              {errors.resume && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.resume}
                </p>
              )}
            </Card>

            {/* AI Information */}
            <Card>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <GraduationCap size={20} />
              </div>

              <h3 className="mt-4 font-semibold">
                What happens next?
              </h3>

              <div className="mt-4 space-y-4">
                <InfoStep
                  number="1"
                  text="AI analyzes your resume and target role."
                />

                <InfoStep
                  number="2"
                  text="Your skills and knowledge gaps are identified."
                />

                <InfoStep
                  number="3"
                  text="A personalized preparation plan is generated."
                />

                <InfoStep
                  number="4"
                  text="Your plan evolves based on your performance."
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          {errors.submit && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {errors.submit}
            </div>
          )}

          <label className="mb-5 flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={aiProcessingConsent}
              onChange={(event) => {
                setAiProcessingConsent(event.target.checked);
                setErrors((current) => ({
                  ...current,
                  aiProcessingConsent: "",
                }));
              }}
              disabled={isSubmitting}
              className="mt-1 accent-indigo-600"
            />
            <span>
              I agree that my resume text and preparation details may be sent to Google Gemini to generate interview preparation content. PrepPilot stores my resume text until I delete my account.
              {errors.aiProcessingConsent && (
                <span className="mt-1 block text-xs text-red-500" role="alert">
                  {errors.aiProcessingConsent}
                </span>
              )}
            </span>
          </label>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              You can update your preparation preferences
              later.
            </p>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating preparation..."
                : "Generate Preparation Plan"}

              {!isSubmitting && (
                <ArrowRight size={18} />
              )}
            </Button>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

// --------------------------------
// Section Header
// --------------------------------

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[var(--muted)]">
          {description}
        </p>
      </div>
    </div>
  );
};

// --------------------------------
// Select Card
// --------------------------------

const SelectCard = ({
  label,
  selected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl
        border
        px-4
        py-3
        text-sm
        font-medium
        transition-all
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${selected
          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
        }
      `}
    >
      {label}
    </button>
  );
};

// --------------------------------
// Information Step
// --------------------------------

const InfoStep = ({
  number,
  text,
}) => {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
        {number}
      </div>

      <p className="text-sm leading-5 text-[var(--muted)]">
        {text}
      </p>
    </div>
  );
};

export default StartPreparation;
