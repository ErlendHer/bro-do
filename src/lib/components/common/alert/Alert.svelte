<script lang="ts" context="module">
	export interface AlertProps {
		title: string;
		message: string;
		acceptsInput?: boolean;
		inputValidator?: (input: string) => boolean;
		onOk: (result: string) => Promise<void>;
		onCancel: () => void;
	}
</script>

<script lang="ts">
	import { notificationsStore, NotificationType } from '$lib/stores/notifications.store';

	import ButtonWithActionSpinner from '../ButtonWithActionSpinner.svelte';

	export let message = '';
	export let title = 'Title not set';
	export let acceptsInput = false;

	export let onOk = async (result: string): Promise<void> => {};
	export let onCancel = () => {};
	export let inputValidator = (input: string) => true;

	let inputValue = '';
	$: isValid = inputValidator(inputValue);
	let loading = false;

	const finish = async () => {
		loading = true;
		try {
			await onOk(inputValue);
		} catch (error: any) {
			notificationsStore.push({
				text: `Failed with error: ${error.message}`,
				type: NotificationType.Error
			});
		}
		onCancel();
	};
</script>

<div
	class="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md min-w-[20rem] mt-auto text-center flex flex-col items-center"
>
	<h3 class="text-lg font-medium mb-4 text-cyan-50">{title}</h3>
	<div class="text-sm mb-4 text-cyan-100">{message}</div>
	{#if acceptsInput}
		<input
			bind:value={inputValue}
			class="bg-gray-700 text-white focus:bg-gray-600 focus:text-white rounded-md py-2 px-3 mb-3 leading-tight focus:outline-none w-full max-w-[10rem]"
			name="name"
			type="text"
			placeholder="NewList"
		/>
	{/if}
	<div class="flex justify-end flex-grow w-full gap-2">
		<button
			on:click={onCancel}
			class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mr-2"
		>
			Cancel
		</button>
		<ButtonWithActionSpinner text="OK" disabled={!isValid} onClick={finish} {loading} />
	</div>
</div>
