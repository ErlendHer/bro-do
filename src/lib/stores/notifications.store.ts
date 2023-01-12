import { writable } from 'svelte/store';

function createNotificationsStore() {
	const { update, subscribe } = writable<Notification[]>([]);

	return {
		subscribe,
		remove: (notification: Notification) =>
			update((notifications) => notifications.filter((n) => n !== notification)),
		push: (notification: Notification) =>
			update((notifications) => [...notifications, notification])
	};
}

export const notificationsStore = createNotificationsStore();

export interface Notification {
	text: string;
	type: NotificationType;
}

export enum NotificationType {
	Error,
	Success
}
