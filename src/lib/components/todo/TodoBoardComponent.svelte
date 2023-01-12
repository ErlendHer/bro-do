<script lang="ts">
	import { firebase } from '$lib/access/firebase';
	import { FirestoreAccess } from '$lib/access/firestore';
	import { failNotification } from '$lib/notification/notification';
	import type { TodoBoard, TodoList } from '$lib/stores/todos.store';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import ButtonWithActionSpinner from '../common/ButtonWithActionSpinner.svelte';
	import AddTodoComponent from './AddTodoComponent.svelte';
	import TodoListComponent, { openAddBoardModal } from './TodoList.svelte';

	export let todoBoard: TodoBoard;
	let loading = false;

	let snapshotBeforeMove: TodoBoard | null = null;

	function deepCopyTodoBoard() {
		const newBoard: TodoBoard = { ...todoBoard };
		todoBoard.lists = todoBoard.lists.map((list) => ({ ...list }));
		return newBoard;
	}

	async function logOut() {
		loading = true;
		try {
			await firebase.auth.signOut();
		} catch (error: any) {
			failNotification(error.message);
		}
		loading = false;
	}

	function handleSort(e: CustomEvent<DndEvent<TodoList>>) {
		if (!snapshotBeforeMove) {
			snapshotBeforeMove = deepCopyTodoBoard();
		}
		todoBoard.lists = e.detail.items;
	}

	async function updateBoard(e: CustomEvent<DndEvent<TodoList>>) {
		if (!snapshotBeforeMove) {
			return;
		}

		var oldLists = snapshotBeforeMove.lists;
		var newLists = e.detail.items;

		// Check if we have rearranged any items
		if (oldLists.map((list) => list.id).join('') == newLists.map((list) => list.id).join('')) {
			snapshotBeforeMove = null;
			todoBoard.lists = newLists;
			return;
		}

		try {
			await FirestoreAccess.updateListOrders(newLists);
		} catch (error: any) {
			failNotification(`Failed to move board with message: ${error.message}`);
		}
		snapshotBeforeMove = null;
	}
</script>

<div
	class="bg-gray-900 w-full overflow-y-auto flex flex-col items-center py-6 px-2 justify-stretch"
>
	<AddTodoComponent />
	{#if todoBoard.lists.length > 0}
		<div
			class="container flex-grow flex flex-row justify-center flex-wrap min-h-[80vh] mb-4 items-stretch"
			use:dndzone={{ items: todoBoard.lists, type: 'board' }}
			on:consider={handleSort}
			on:finalize={updateBoard}
		>
			{#each todoBoard.lists as list (list.id)}
				<TodoListComponent
					todoList={{ ...list, todos: list.todos.sort((a, b) => a.order - b.order) }}
				/>
			{/each}
		</div>
	{:else}
		<div class="bg-gray-800 text-white p-4 flex flex-col p-12 gap-4 rounded-lg m-4">
			<p class="text-xl">No lists found</p>
			<button
				on:click={openAddBoardModal}
				class="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg">Add list</button
			>
		</div>
	{/if}

	<ButtonWithActionSpinner text="Log out" onClick={logOut} />
</div>
