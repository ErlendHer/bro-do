<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let text = 'No text provided';
	const dispatch = createEventDispatcher();

	function onDelete() {
		dispatch('message', null);
	}
</script>

<li class="todo-card bg-gray-700 rounded-lg p-2 shadow mb-2 w-full">
	<div class="flex items-center">
		<div class="flex-1">
			<p class="text-white">{text}</p>
		</div>
		<button class="text-gray-500 hover:text-white opacity-0" on:click={onDelete}>
			<svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
				<svg viewBox="0 0 24 24">
					<path
						fill="currentColor"
						stroke="none"
						d="M22 4.2h-5.6L15 1.6c-.1-.2-.4-.4-.7-.4H9.6c-.2 0-.5.2-.6.4L7.6 4.2H2c-.4 0-.8.4-.8.8s.4.8.8.8h1.8V22c0 .4.3.8.8.8h15c.4 0 .8-.3.8-.8V5.8H22c.4 0 .8-.3.8-.8s-.4-.8-.8-.8zM10.8 16.5c0 .4-.3.8-.8.8s-.8-.3-.8-.8V10c0-.4.3-.8.8-.8s.8.3.8.8v6.5zm4 0c0 .4-.3.8-.8.8s-.8-.3-.8-.8V10c0-.4.3-.8.8-.8s.8.3.8.8v6.5z"
					/>
				</svg>
			</svg>
		</button>
	</div>
</li>

<style>
	button {
		transition: opacity 0.2s ease-in-out;
	}
	.todo-card:hover button {
		opacity: 0.7;
	}
</style>
