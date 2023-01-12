<script lang="ts">
	import { notificationsStore, NotificationType } from '$lib/stores/notifications.store';
	import { onDestroy } from 'svelte';
	import { getNotificationsContext } from 'svelte-notifications';
	import type { Unsubscriber } from 'svelte/store';

	let unsubscribe: Unsubscriber | undefined;

	const { addNotification } = getNotificationsContext();

	unsubscribe = notificationsStore.subscribe((notification) => {
		if (notification.length > 0) {
			var notificationToProcess = notification[0];

			addNotification({
				text: notificationToProcess.text,
				type: notificationToProcess.type == NotificationType.Success ? 'success' : 'error',
				position: 'bottom-center',
				removeAfter: 6000
			});

			notificationsStore.remove(notificationToProcess);
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>
