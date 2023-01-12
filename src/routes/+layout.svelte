<script lang="ts">
	import { firebase } from '$lib/access/firebase';
	import { user } from '$lib/stores/user.store';
	import { onAuthStateChanged } from 'firebase/auth';
	import { onDestroy, onMount } from 'svelte';
	import Notifications from 'svelte-notifications';
	import type { Unsubscriber } from 'svelte/store';
	import Modal from 'svelte-simple-modal';
	import '../app.postcss';

	let unsubscribe: Unsubscriber | undefined;
	let initialized = false;

	const authSubscriber = () => {
		onAuthStateChanged(firebase.auth, async (userAuthData) => {
			// Add setTimeout to allow for notifications
			setTimeout(() => {
				if (userAuthData) {
					user.set(userAuthData);
				} else if (initialized) {
					user.set(null);
				}
				initialized = true;
			});
		});
	};

	onMount(async () => {
		authSubscriber();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<Notifications>
	<Modal
		unstyled={true}
		classBg="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center bg-gray-600 bg-opacity-30"
		classWindowWrap="relative m-2 max-h-full"
		classContent="relative p-2 overflow-auto flex items-center justify-center"
		closeButton={false}
	>
		<div class="bg-gray-900 w-screen min-h-screen flex flex-col items-center justify-center">
			<slot />
		</div>
	</Modal>
</Notifications>
