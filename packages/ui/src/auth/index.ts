/**
 * Auth Components for AppStandard Suite
 * Shared authentication forms with parametric configuration
 */

export {
	ChangePasswordForm,
	type ChangePasswordFormProps,
} from "./change-password-form";
export { CheckEmailPage, type CheckEmailPageProps } from "./check-email-page";
// Password Management
export {
	ForgotPasswordForm,
	type ForgotPasswordFormProps,
} from "./forgot-password-form";
export {
	ResendVerificationForm,
	type ResendVerificationFormProps,
} from "./resend-verification-form";
export {
	ResetPasswordForm,
	type ResetPasswordFormProps,
} from "./reset-password-form";
// Sign In / Sign Up (existing)
export { SignInForm, type SignInFormProps } from "./sign-in-form";
export { SignUpForm, type SignUpFormProps } from "./sign-up-form";
// Types
export type {
	AuthClient,
	BaseAuthFormProps,
	NavigateFunction,
	UseSearchFunction,
} from "./types";
// Email Verification
export {
	VerifyEmailPage,
	type VerifyEmailPageProps,
} from "./verify-email-page";
