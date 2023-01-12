<script lang="ts">
	import { goto } from '$app/navigation';
	import { firebase } from '$lib/access/firebase';
	import ButtonWithActionSpinner from '$lib/components/common/ButtonWithActionSpinner.svelte';
	import { notificationsStore, NotificationType } from '$lib/stores/notifications.store';
	import { user } from '$lib/stores/user.store';
	import type { FirebaseError } from 'firebase/app';
	import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';

	let emailError = '';
	let passwordError = '';
	let formValid = false;
	let waiting = false;

	let mode: 'login' | 'register' = 'login';

	$: {
		formValid = validateForm(email, password);
	}

	onMount(() => {
		user.subscribe((user) => {
			if (user) {
				goto('/');
			}
		});
	});

	function validateForm(email: string, password: string) {
		if (email && password && email !== '' && password !== '') {
			return true;
		} else {
			return false;
		}
	}

	async function register() {
		if (!emailUsernameIsDefined()) return;
		// Perform regex validation on email
		const emailRegex = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g);

		let valid = true;
		if (!emailRegex.test(email as string)) {
			emailError = 'Email is invalid';
			valid = false;
		}

		if (password.length < 8) {
			passwordError = 'Password must be at least 8 characters';
			valid = false;
		}

		if (!valid) return;

		try {
			await createUserWithEmailAndPassword(firebase.auth, email, password);
		} catch (error) {
			notificationsStore.push({
				text: `Failed to create user with error: ${(error as FirebaseError).message}`,
				type: NotificationType.Error
			});
			return;
		}
		notificationsStore.push({
			text: `User created successfully`,
			type: NotificationType.Success
		});
	}

	async function login() {
		if (!emailUsernameIsDefined()) return;

		try {
			await signInWithEmailAndPassword(firebase.auth, email, password);
			notificationsStore.push({
				text: `Successfully signed in`,
				type: NotificationType.Success
			});
		} catch (error) {
			console.error(error);
			notificationsStore.push({
				text: `Failed to sign in with error: ${(error as FirebaseError).message}`,
				type: NotificationType.Error
			});
			return;
		}
	}

	function emailUsernameIsDefined(): boolean {
		let valid = true;
		if (!email || email === '') {
			emailError = 'Email is required';
			valid = false;
		}

		if (!password || password === '') {
			passwordError = 'Password is required';
			valid = false;
		}

		return valid;
	}

	async function submitForm() {
		waiting = true;
		var funcToExecute = mode == 'login' ? login : register;
		await funcToExecute();
		waiting = false;
	}
</script>

<form
	class="bg-gray-800 text-white rounded px-8 pt-6 pb-8 mb-4 max-w-md mx-auto w-full"
	on:submit|preventDefault
>
	<h2 class="text-2xl font-bold mb-2">
		{mode == 'login' ? 'Log In' : 'Register new user'}
	</h2>
	<div class="mb-4">
		<label class="block text-sm font-bold mb-2" for="username"> Email </label>
		<input
			bind:value={email}
			class="bg-gray-700 text-white focus:bg-gray-600 focus:text-white rounded-md py-2 px-3 mb-3 leading-tight focus:outline-none w-full"
			name="email"
			type="text"
			placeholder="mail@domain.com"
		/>
		{#if emailError}
			<p class="text-red-500 text-xs italic">{emailError}</p>
		{/if}
	</div>
	<div class="mb-6">
		<label class="block text-sm font-bold mb-2" for="password"> Password </label>
		<input
			bind:value={password}
			class="bg-gray-700 text-white focus:bg-gray-600 focus:text-white rounded-md py-2 px-3 mb-3 leading-tight focus:outline-none w-full"
			name="password"
			type="password"
			placeholder="********"
		/>
		{#if passwordError}
			<p class="text-red-500 text-xs italic">{passwordError}</p>
		{/if}
	</div>
	<div class="flex items-center justify-between">
		<ButtonWithActionSpinner
			text={mode == 'login' ? 'Login' : 'Register'}
			loading={waiting}
			disabled={!formValid || waiting}
			onClick={submitForm}
		/>
		<a
			class="inline-block align-baseline font-bold text-sm hover:underline cursor-pointer"
			on:click={() => (mode == 'login' ? (mode = 'register') : (mode = 'login'))}
			href={null}
		>
			{mode === 'login' ? 'Register instead' : 'Login instead'}
		</a>
	</div>
</form>
