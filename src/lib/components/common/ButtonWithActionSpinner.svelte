<script lang="ts">
	import { Circle3 } from 'svelte-loading-spinners';
	import {} from 'svelte/animate';

	export let text = 'No text provided';
	export let loading = false;
	export let disabled = false;
	export let onClick = () => {};
</script>

<button
	{disabled}
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500 disabled:hover:text-white flex gap-2 items-center"
	type="submit"
	on:click={onClick}
>
	{text}
	{#if loading}
		<Circle3 size="24" />
	{/if}
</button>
