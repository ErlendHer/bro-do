import { firebase } from '$lib/access/firebase';
import { fail, type Actions } from '@sveltejs/kit';
import type { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const actions: Actions = {
	register: async ({ request }) => {
		const { email, password } = await getEmailPassword(request);
		let { emailError, passwordError } = validateEmailUsernameDefined(email, password);

		// Perform regex validation on email
		const emailRegex = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g);
		if (!emailRegex.test(email as string)) {
			emailError = 'Email is invalid';
		}

		if (password.length < 8) {
			passwordError = 'Password must be at least 8 characters';
		}

		if (emailError || passwordError) {
			return fail(400, {
				emailError,
				passwordError
			});
		}

		try {
			await createUserWithEmailAndPassword(firebase.auth, email, password);
		} catch (error) {
			return fail<FormResult>(400, {
				firebaseError: `Failed to create user with error: ${(error as FirebaseError).message}`
			});
		}

		return { successMessage: 'Successfully created user. You can now log in!' } as FormResult;
	},
	login: async ({ request }) => {
		const { email, password } = await getEmailPassword(request);
		const { emailError, passwordError } = validateEmailUsernameDefined(email, password);

		if (emailError || passwordError) {
			return fail(400, {
				emailError,
				passwordError
			});
		}

		try {
			await signInWithEmailAndPassword(firebase.auth, email, password);
		} catch (error) {
			console.error(error);
			return fail<FormResult>(400, {
				firebaseError: `Failed to sign in with error: ${(error as FirebaseError).message}`
			});
		}

		return { successMessage: 'Successfully logged in' } as FormResult;
	}
};

async function getEmailPassword(request: Request) {
	const data = await request.formData();

	const email = data.get('email') as string;
	const password = data.get('password') as string;

	return { email, password };
}

function validateEmailUsernameDefined(email: string, password: string) {
	let emailError: string | null = null;
	let passwordError: string | null = null;

	if (!email || email === '') {
		emailError = 'Email is required';
	}

	if (!password || password === '') {
		passwordError = 'Password is required';
	}

	return { emailError, passwordError };
}

export interface FormResult {
	emailError?: string;
	passwordError?: string;
	firebaseError?: string;
	successMessage?: string;
	[key: string]: unknown;
}
