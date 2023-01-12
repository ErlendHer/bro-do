import { CardStatus, type Todo, type TodoList, type TodoStore } from '$lib/stores/todos.store';
import type { Unsubscribe } from 'firebase/auth';
import {
	addDoc,
	collection,
	CollectionReference,
	deleteDoc,
	doc,
	DocumentReference,
	Firestore,
	getDoc,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	Query,
	query,
	runTransaction,
	setDoc,
	updateDoc
} from 'firebase/firestore';
import { Collection, type ListSchema, type TodoSchema, type UserSchema } from './database.schema';
import { firebase } from './firebase';

export class FirestoreAccess {
	private static _db: Firestore;
	private static _userUid: string | null = null;

	public static get db() {
		if (!this._db) {
			this._db = getFirestore(firebase.app);
		}
		return this._db;
	}

	private static userRef() {
		if (!this._userUid) {
			throw new Error('User not logged in');
		}
		return doc(this.db, Collection.Users, this._userUid) as DocumentReference<UserSchema>;
	}

	private static listRef(listId: string) {
		return doc(this.userRef(), Collection.Lists, listId) as DocumentReference<ListSchema>;
	}

	private static todoRef(listId: string, todoId: string) {
		return doc(this.listRef(listId), Collection.Todos, todoId) as DocumentReference<TodoSchema>;
	}

	private static todoCollection(listRef: DocumentReference<ListSchema>) {
		return collection(listRef, Collection.Todos) as CollectionReference<TodoSchema>;
	}

	private static listCollection() {
		return collection(this.userRef(), Collection.Lists) as CollectionReference<ListSchema>;
	}

	static async createDefaultUserTodoIfNotExists(uid: string, email: string) {
		this._userUid = uid;

		const existingUser = await getDoc(this.userRef());
		// User exists, return
		if (existingUser.exists()) {
			return;
		}

		await this.createUser(uid, email);

		const todoRef = await this.createList({
			title: 'todo',
			order: 0,
			cardStatus: CardStatus.Todo
		});
		await this.createList({ title: 'waiting', order: 1, cardStatus: CardStatus.Waiting });
		await this.createList({ title: 'done', order: 2, cardStatus: CardStatus.Done });

		await this.createTodo(todoRef.id, {
			title: 'Move me around!',
			description: 'Test description',
			order: 0
		});
	}

	private static async createUser(uid: string, email: string) {
		const user: UserSchema = { email };
		return await setDoc(doc(this.db, Collection.Users, uid), user);
	}

	static async createList(list: ListSchema) {
		return await addDoc(collection(this.userRef(), Collection.Lists), list);
	}

	static async createTodo(listId: string, todo: TodoSchema) {
		const listRef = this.listRef(listId);

		await addDoc(this.todoCollection(listRef), todo);
	}

	static async subscribeToChanges(store: TodoStore) {
		const listRef = collection(this.userRef(), Collection.Lists) as CollectionReference<ListSchema>;

		const listSubscription: Unsubscribe[] = [];

		const unsubscribe = onSnapshot(listRef, (querySnapshot) => {
			// Clear old subscriptions when lists are added / deleted
			listSubscription.forEach((unsub) => unsub());
			listSubscription.length = 0;

			const lists: ListsWithId[] = [];

			querySnapshot.forEach((listDoc) => {
				lists.push({ list: listDoc.data(), listId: listDoc.id });

				const todosRef = collection(
					listDoc.ref,
					Collection.Todos
				) as CollectionReference<TodoSchema>;

				listSubscription.push(
					onSnapshot(todosRef, (querySnapshot) => {
						const todos: TodoWithId[] = [];

						querySnapshot.forEach((todoDoc) => {
							todos.push({ todo: todoDoc.data(), id: todoDoc.id });
						});

						store.setTodos({ todos, todoId: listDoc.id, listId: listDoc.id });
					})
				);
			});

			store.setLists(lists);
		});

		return unsubscribe;
	}

	static async addTodo(q: Query<ListSchema>, title: string) {
		const firstListSnapshot = await getDocs(q);

		if (firstListSnapshot.empty) {
			return;
		}

		const doc = firstListSnapshot.docs[0];
		const lastTodoQuery = query(
			collection(doc.ref, Collection.Todos) as CollectionReference<TodoSchema>,
			orderBy('order', 'desc'),
			limit(1)
		);
		const lastTodoSnapshot = await getDocs(lastTodoQuery);

		const newOrder = lastTodoSnapshot.empty ? 0 : lastTodoSnapshot.docs[0].data().order + 1;
		await addDoc(collection(doc.ref, Collection.Todos) as CollectionReference<TodoSchema>, {
			title: title,
			description: '',
			order: newOrder
		});
	}

	static async addTodoToFirstList(title: string) {
		// First, get the lists of the user
		const firstListQuery = query(
			collection(this.userRef(), Collection.Lists) as CollectionReference<ListSchema>,
			orderBy('order', 'asc'),
			limit(1)
		);
		await this.addTodo(firstListQuery, title);
	}

	private static async updateTodosOrder(
		todos: Todo[],
		listRef: DocumentReference<ListSchema>,
		idToIgnore = ''
	) {
		todos.forEach(async (todo, idx) => {
			if (todo.id === idToIgnore) {
				return;
			}
			await updateDoc(doc(listRef, Collection.Todos, todo.id) as DocumentReference<TodoSchema>, {
				order: idx
			});
		});
	}

	static async addTodoToList(todoToAdd: Todo, listId: string, todos: Todo[]) {
		await runTransaction(this._db, async () => {
			const listRef = this.listRef(listId);
			await addDoc(this.todoCollection(listRef), {
				title: todoToAdd.title,
				description: '',
				order: todoToAdd.order
			});

			await this.updateTodosOrder(todos, listRef, todoToAdd.id);
		});
	}

	static async updateTodoOrders(listId: string, todos: Todo[]) {
		const listRef = this.listRef(listId);

		await runTransaction(this._db, async () => {
			await this.updateTodosOrder(todos, listRef);
		});
	}

	static async removeTodoFromList(todoToRemove: Todo, listId: string) {
		const listRef = this.listRef(listId);
		await deleteDoc(
			doc(listRef, Collection.Todos, todoToRemove.id) as DocumentReference<TodoSchema>
		);
	}

	static async updateListTitle(listId: string, title: string) {
		const listRef = this.listRef(listId);
		await updateDoc(listRef, { title });
	}

	static async deleteAllTodos(listId: string) {
		const listRef = this.listRef(listId);

		const lastTodoQuery = query(
			collection(listRef, Collection.Todos) as CollectionReference<TodoSchema>
		);

		const todoItems = await getDocs(lastTodoQuery);

		await runTransaction(this._db, async () => {
			todoItems.forEach(async (todoItem) => {
				await deleteDoc(todoItem.ref);
			});
		});
	}

	static async deleteTodoItem(listId: string, todoId: string) {
		await deleteDoc(this.todoRef(listId, todoId));
	}

	static async updateListOrders(lists: TodoList[]) {
		await runTransaction(this._db, async () => {
			lists.forEach(async (list, idx) => {
				await updateDoc(this.listRef(list.id), {
					order: idx
				});
			});
		});
	}

	static async deleteList(listId: string) {
		await this.deleteAllTodos(listId);
		await deleteDoc(this.listRef(listId));
	}

	static async newList(title: string) {
		const lastListQuery = query(this.listCollection(), orderBy('order', 'desc'), limit(1));
		const lastListSnapshot = await getDocs(lastListQuery);
		const newOrder = lastListSnapshot.empty ? 0 : lastListSnapshot.docs[0].data().order + 1;
		await this.createList({ title, order: newOrder, cardStatus: CardStatus.Waiting });
	}
}

export interface ListsWithId {
	list: ListSchema;
	listId: string;
}

interface TodoWithId {
	todo: TodoSchema;
	id: string;
}

export interface TodosWithId {
	todos: TodoWithId[];
	todoId: string;
	listId: string;
}
