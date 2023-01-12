import type { ListsWithId, TodosWithId } from '$lib/access/firestore';
import { writable } from 'svelte/store';

function createTodoStore() {
	const { set, update, subscribe } = writable<TodoBoard>({ lists: [] });
	// TODO: Only update if something changed

	function setLists(lists: ListsWithId[]) {
		set({
			lists: lists.map(({ list, listId }) => ({
				id: listId,
				title: list.title,
				cardStatus: list.cardStatus,
				todos: [],
				order: list.order
			}))
		});
	}

	function setTodos(todos: TodosWithId) {
		update(($store) => {
			const newLists = $store.lists.map((list) =>
				list.id === todos.listId
					? {
							...list,
							todos: todos.todos.map(({ todo, id }) => ({
								id,
								title: todo.title,
								description: todo.description,
								cardStatus: list.cardStatus,
								order: todo.order
							}))
					  }
					: list
			);

			return {
				lists: newLists
			};
		});
	}

	return {
		subscribe,
		setLists: setLists,
		setTodos
	};
}

export const todos = createTodoStore();
export type TodoStore = typeof todos;

export interface Todo {
	id: string;
	title: string;
	description: string;
	cardStatus: CardStatus;
	order: number;
}

export interface TodoList {
	id: string;
	title: string;
	cardStatus: CardStatus;
	todos: Todo[];
	order: number;
}

export interface TodoBoard {
	lists: TodoList[];
}

export enum CardStatus {
	Todo = 0,
	Waiting = 1,
	Done = 2
}
