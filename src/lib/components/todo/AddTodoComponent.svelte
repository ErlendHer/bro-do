<script lang="ts">
	import { FirestoreAccess } from '$lib/access/firestore';
	import { notificationsStore, NotificationType } from '$lib/stores/notifications.store';
	import ButtonWithActionSpinner from '../common/ButtonWithActionSpinner.svelte';
	let inputValue = '';
	let loading = false;

	async function addTodo() {
		loading = true;
		try {
			await FirestoreAccess.addTodoToFirstList(inputValue);
		} catch (error) {
			notificationsStore.push({
				text: `Failed to create todo item`,
				type: NotificationType.Error
			});
		}
		loading = false;
		inputValue = '';
	}
</script>

<div class="w-full flex items-center justify-center">
	<div class="flex flex-row gap-4 mb-2 max-w-lg w-full items-stretch  justify-center">
		<input
			class="bg-gray-800 text-white rounded-lg min-w-[160px] py-2 px-4 block text-lg font-medium focus:outline-none focus:shadow-outline-orange flex-grow"
			placeholder="what needs to be done?"
			bind:value={inputValue}
			on:keydown={(e) => {
				if (e.key === 'Enter' && inputValue.length > 0) {
					addTodo();
				}
			}}
		/>
		<ButtonWithActionSpinner
			text="Add todo"
			onClick={addTodo}
			{loading}
			disabled={inputValue.length < 1}
		/>
	</div>
</div>
