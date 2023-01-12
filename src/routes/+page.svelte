<script lang="ts">
	import { goto } from '$app/navigation';
	import { FirestoreAccess } from '$lib/access/firestore';
	import TodoBoardComponent from '$lib/components/todo/TodoBoardComponent.svelte';
	import { todos, type TodoBoard } from '$lib/stores/todos.store';
	import { user } from '$lib/stores/user.store';
	import type { Unsubscribe } from 'firebase/auth';
	import { onDestroy, onMount } from 'svelte';

	let initialized = false;
	const subscriptions: Unsubscribe[] = [];
	let todoBoard: TodoBoard = { lists: [] };

	onMount(async () => {
		subscriptions.push(
			user.subscribe(async (user) => {
				if (!user) {
					initialized = true;
					return goto('/login');
				}
				try {
					if (!initialized) {
						initialized = true;
						await FirestoreAccess.createDefaultUserTodoIfNotExists(user!.uid, user!.email ?? '');
						subscriptions.push(await FirestoreAccess.subscribeToChanges(todos));
					}
				} catch (err) {
					console.error(err);
				}
			})
		);

		subscriptions.push(
			todos.subscribe((newBoard) => {
				todoBoard = newBoard;
			})
		);
	});

	onDestroy(() => {
		subscriptions.forEach((unsub) => unsub());
	});
</script>

<main class="min-h-[100vh] w-full h-full flex justify-center justify-item content-center">
	<TodoBoardComponent
		todoBoard={{ ...todoBoard, lists: todoBoard.lists.sort((a, b) => a.order - b.order) }}
	/>
</main>
