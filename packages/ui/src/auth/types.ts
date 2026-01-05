/**
 * Shared auth types for parametric authentication components
 */

/**
 * Minimal auth client interface that all apps must provide
 * This is a subset of Better-Auth client methods used by shared components
 */
export interface AuthClient {
	useSession: () => {
		data: { user: { name: string; email: string } } | null;
		isPending: boolean;
	};
	signIn: {
		email: (
			params: { email: string; password: string },
			options: {
				onSuccess: () => void;
				onError: (error: {
					error: { message?: string; statusText?: string; status?: number };
				}) => void;
			},
		) => Promise<unknown>;
	};
	signUp: {
		email: (
			params: { email: string; password: string; name: string },
			options: {
				onSuccess: () => void;
				onError: (error: {
					error: { message?: string; statusText?: string; status?: number };
				}) => void;
			},
		) => Promise<unknown>;
	};
	signOut: (options: { fetchOptions: { onSuccess: () => void } }) => void;
	getSession: () => Promise<unknown>;
	sendVerificationEmail?:
		| ((params: { email: string; callbackURL: string }) => Promise<unknown>)
		| undefined;
	requestPasswordReset?:
		| ((params: { email: string; redirectTo: string }) => Promise<unknown>)
		| undefined;
	resetPassword?:
		| ((params: { newPassword: string; token: string }) => Promise<unknown>)
		| undefined;
	changePassword?:
		| ((params: {
				currentPassword: string;
				newPassword: string;
				revokeOtherSessions?: boolean | undefined;
		  }) => Promise<unknown>)
		| undefined;
	updateUser?: ((params: { name: string }) => Promise<unknown>) | undefined;
	deleteUser?:
		| ((params?: { password?: string | undefined }) => Promise<unknown>)
		| undefined;
}

/**
 * Navigation function type (from TanStack Router)
 */
export type NavigateFunction = (options: {
	to: string;
	search?: Record<string, string | undefined>;
}) => void;

/**
 * Search params getter function type (from TanStack Router)
 */
export type UseSearchFunction<T> = (options: { from: string }) => T;

/**
 * Common props for auth form components
 */
export interface BaseAuthFormProps {
	/** Auth client instance (from app's auth-client.ts) */
	authClient: AuthClient;
	/** Navigation function from TanStack Router */
	navigate: NavigateFunction;
	/** App icon component */
	icon?: React.ReactNode | undefined;
	/** Show background effects (aurora, dot-grid) */
	showBackgroundEffects?: boolean | undefined;
}
