<script lang="ts">
	export let text = 'No text provided';
	export let onClick = () => {};
</script>

<button
	on:click={onClick}
	class="block px-4 py-2 text-sm leading-5 text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600 w-full"
	>{text}</button
>
