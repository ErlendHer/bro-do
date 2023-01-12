<script lang="ts" context="module">
	export const addBoardModalTemplate = {
		title: 'Create new List',
		message: 'Enter desired title',
		acceptsInput: true,
		onOk: async (listName: string) => {
			await FirestoreAccess.newList(listName);
			notificationsStore.push({
				text: `Successfully created list ${listName}`,
				type: NotificationType.Success
			});
		},
		inputValidator: (listName: string) => listName !== ''
	};
</script>

<script lang="ts">
	import { FirestoreAccess } from '$lib/access/firestore';
	import type { Todo, TodoList } from '$lib/stores/todos.store';
	import type { DndEvent } from 'svelte-dnd-action';
	import { dndzone } from 'svelte-dnd-action';
	import Alert, { type AlertProps } from '../common/alert/Alert.svelte';
	import MenuOption from './MenuOption.svelte';
	import TodoCard from './TodoCard.svelte';
	import { notificationsStore, NotificationType } from '$lib/stores/notifications.store';
	import { getContext } from 'svelte';

	const { open, close } = getContext<{
		open: (alert: typeof Alert, props: AlertProps) => void;
		close: () => void;
	}>('simple-modal');

	function getConfirmation(
		title: string,
		message: string,
		onOk: (result: string) => Promise<void>
	) {
		open(Alert, { title, message, onOk, onCancel: close });
	}

	export function openAddBoardModal() {
		open(Alert, { ...addBoardModalTemplate, onCancel: close });
	}

	export let todoList: TodoList;
	let snapshotBeforeMove: TodoList | null = null;

	let editingTitle = false;
	let titleSnapshot: string | null = null;
	let inputRef: HTMLInputElement | null = null;

	let menuVisible = false;

	function startEditTitle() {
		editingTitle = true;
		titleSnapshot = todoList.title.slice();
		setTimeout(() => {
			if (inputRef) {
				inputRef.focus();
			}
		});
	}

	function finishEditTitle() {
		editingTitle = false;
		if (todoList.title != titleSnapshot) {
			FirestoreAccess.updateListTitle(todoList.id, todoList.title);
		}
		titleSnapshot = null;
	}

	function toggleMenuVisible() {
		menuVisible = !menuVisible;
	}

	function deepCopyTodoList(todoList: TodoList): TodoList {
		const newTodoList = { ...todoList };
		newTodoList.todos = todoList.todos.map((todo) => ({ ...todo }));
		return newTodoList;
	}

	function handleSort(e: CustomEvent<DndEvent<Todo>>) {
		if (!snapshotBeforeMove) {
			snapshotBeforeMove = deepCopyTodoList(todoList);
		}
		todoList.todos = e.detail.items;
	}

	async function handleUpdateScenarios(newTodos: Todo[]) {
		const oldTodos = snapshotBeforeMove!.todos;

		// Three scenarios
		// 1. same list length -> todos items have been swapped.
		if (oldTodos.length == newTodos.length) {
			if (oldTodos == newTodos) {
				return;
			}
			// Check if we have rearranged any items
			if (oldTodos.map((todo) => todo.id).join('') == newTodos.map((todo) => todo.id).join('')) {
				return;
			}

			await FirestoreAccess.updateTodoOrders(todoList.id, newTodos);
			return;
		}

		// 2. new list length is greater -> new item has been added
		// find the new item
		if (newTodos.length > oldTodos.length) {
			const todoToAddIdx = newTodos.findIndex(
				(todo) => oldTodos.find((oldTodo) => oldTodo.id == todo.id) == undefined
			);
			if (todoToAddIdx == -1) {
				return;
			}

			const todoToAdd = newTodos[todoToAddIdx];
			todoToAdd.order = todoToAddIdx; // set correct order index

			await FirestoreAccess.addTodoToList(todoToAdd, todoList.id, newTodos);
			return;
		}

		// 3. new list length is smaller, item has been removed
		if (newTodos.length < oldTodos.length) {
			// Find missing element
			const todoToRemove = oldTodos.find(
				(todo) => newTodos.find((newTodo) => newTodo.id == todo.id) == undefined
			);

			if (todoToRemove) {
				await FirestoreAccess.removeTodoFromList(todoToRemove, todoList.id);
			}
		}
	}
	async function updateList(e: CustomEvent<DndEvent<Todo>>) {
		handleSort(e);
		await handleUpdateScenarios(e.detail.items);

		snapshotBeforeMove = null;
	}

	async function deleteTodoItem(id: string) {
		try {
			FirestoreAccess.deleteTodoItem(todoList.id, id);
		} catch (error: any) {
			notificationsStore.push({
				text: `Failed to delete todo item: ${error.message}`,
				type: NotificationType.Error
			});
		}
	}
</script>

<div
	class="bg-gray-800 p-4 rounded-lg shadow max-w-xs w-full m-2 overflow-y-auto flex flex-col flex-grow max-h-[80vh] min-h-[75vh]"
>
	<div class="flex justify-between items-center">
		{#if !editingTitle}
			<h3
				class="text-white font-medium hover:cursor-pointer"
				on:click={startEditTitle}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						startEditTitle();
					}
				}}
			>
				{todoList.title}
			</h3>
		{:else}
			<input
				bind:this={inputRef}
				class="bg-gray-700 text-white rounded-sm px-2 block w-64 font-medium focus:outline-none focus:shadow-outline-orange"
				bind:value={todoList.title}
				on:blur={finishEditTitle}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						finishEditTitle();
					}
				}}
			/>
		{/if}

		<div class="relative inline-block text-left">
			<button
				on:click={toggleMenuVisible}
				on:blur={() => setTimeout(() => (menuVisible = false), 200)}
				class="text-gray-500 hover:text-white"
			>
				<svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
					<path
						d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
					/>
				</svg>
			</button>

			{#if menuVisible}
				<div class="origin-top-right absolute right-0 w-48 rounded-md bg-gray-800 shadow-lg">
					<div class="py-1 rounded-md bg-gray-900 shadow-xs flex flex-col text-start items-start">
						<MenuOption
							text="Delete todos in this list"
							onClick={() => {
								getConfirmation(
									'Are you sure?',
									'All todos in this list will be deleted permanently',
									async () => {
										await FirestoreAccess.deleteAllTodos(todoList.id);
										notificationsStore.push({
											text: `All todos deleted in list`,
											type: NotificationType.Success
										});
									}
								);
							}}
						/>
						<MenuOption
							text="Delete this list"
							onClick={() => {
								getConfirmation(
									'Are you sure?',
									'This list and all its todos will be deleted permanently',
									async () => {
										await FirestoreAccess.deleteList(todoList.id);
										notificationsStore.push({
											text: `'List deleted successfully'`,
											type: NotificationType.Success
										});
									}
								);
							}}
						/>
						<MenuOption text="Add new list" onClick={openAddBoardModal} />
					</div>
				</div>
			{/if}
		</div>
	</div>
	<ul
		class="mt-2 flex-grow"
		use:dndzone={{ items: todoList.todos }}
		on:consider={handleSort}
		on:finalize={updateList}
	>
		{#each todoList.todos as todo (todo.id)}
			<TodoCard text={todo.title} on:message={(_) => deleteTodoItem(todo.id)} />
		{/each}
	</ul>
</div>
