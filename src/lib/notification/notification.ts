import { getNotificationsContext, type addNotification } from 'svelte-notifications';

async function getContext() {
	// Wait for context
	await new Promise<addNotification>((r) => {
		let retries = 0;
		const interval = setInterval(() => {
			if (retries >= 1000) {
				clearInterval(interval);
				throw new Error('Could not get notifications context');
			}
			retries++;
			try {
				const context = getNotificationsContext();

				if (context) {
					clearInterval(interval);
					r(context.addNotification);
				}
			} catch (error) {
				// Ignore
			}
		}, 1);
	});
	const { addNotification } = getNotificationsContext();
	return addNotification;
}

export async function failNotification(message: string) {
	const addNotification = await getContext();
	addNotification({
		text: message,
		type: 'error',
		position: 'bottom-center',
		removeAfter: 6000
	});
}

export async function successNotification(message: string) {
	const addNotification = await getContext();

	addNotification({
		text: message,
		type: 'success',
		position: 'bottom-center',
		removeAfter: 6000
	});
}
