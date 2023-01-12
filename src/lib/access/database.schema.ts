import type { CardStatus } from '$lib/stores/todos.store';

export enum Collection {
	Users = 'users',
	Lists = 'lists',
	Todos = 'todos'
}

export interface UserSchema {
	email: string;
}

export interface ListSchema {
	title: string;
	order: number;
	cardStatus: CardStatus;
}

export interface TodoSchema {
	title: string;
	description: string;
	order: number;
}
