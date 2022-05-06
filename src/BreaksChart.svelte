<script>
	export let hovered = null;
	export let selected = null;
	export let lineWidth = 3;
	export let height = 15;
	export let breaks = [0,20,40,60,80,100];
	export let colors = ['rgba(234,236,177,.8)', 'rgba(169,216,145,.8)', 'rgba(0,167,186,.8)', 'rgba(0,78,166,.8)', 'rgba(0,13,84,.8)'];
  export let formatTick = d => d.toFixed(0);
  export let suffix = "";
	
	const pos = (val, breaks) => {
		let i = 0;
		while (val > breaks[i + 1]) i += 1;
		let unit = 100 / (breaks.length - 1);
		let offset = (val - breaks[i]) / (breaks[i + 1] - breaks[i]);
		return (i + offset) * unit;
	}
</script>

<style>
	.container {
		margin: 30px 0 24px 0;
		box-sizing: border-box;
		position: relative;
		width: 100%;
	}
	.block {
		position: absolute;
		top: 0;
		height: 100%;
	}
	.line {
		position: absolute;
		top: 0;
		height: calc(100% + 10px);
		border-left: solid 1px black;
	}
	.tick {
		position: absolute;
		z-index: 1;
		top: calc(100% + 8px);
		text-align: center;
		transform: translateX(-50%);
	}
	.marker {
		position: absolute;
		z-index: 2;
		top: -10px;
		height: calc(100% + 10px);
		background-color: black;
	}
	.value {
		position: absolute;
		top: -32px;
		text-align: center;
		transform: translateX(-50%);
		background-color: rgba(255,255,255,.8);
	}
	.marker-hovered {
		background-color: orange;
	}
</style>

<div class="container" style="height: {height}px">
	{#each breaks.slice(1) as brk, i}
		<div class="block" style="width: {100 / (breaks.length - 1)}%; left: {i * (100 / (breaks.length - 1))}%; background-color: {colors[i]};"/>
		<div class="line" style="left: {i * (100 / (breaks.length - 1))}%;"/>
		<div class="tick" style="left: {i * (100 / (breaks.length - 1))}%;">{formatTick(breaks[i])}</div>
	{/each}
	<div class="line" style="left: 100%;"/>
	<div class="tick" style="left: 100%;">{formatTick(breaks[breaks.length - 1])}{suffix}</div>
	{#if selected}
	<div class="marker" style="width: {lineWidth}px; left: calc({pos(selected, breaks)}% - {lineWidth / 2}px);"/>
	<div class="value" style="left: {pos(selected, breaks)}%">{selected}{suffix}</div>
  {/if}
  {#if hovered}
	<div class="marker marker-hovered" style="width: {lineWidth}px; left: calc({pos(hovered, breaks)}% - {lineWidth / 2}px);"/>
	<div class="value" style="left: {pos(hovered, breaks)}%">{hovered}{suffix}</div>
  {/if}
</div>