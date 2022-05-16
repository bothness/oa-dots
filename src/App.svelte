<script>
	// Components for working with Mapbox layers
	import { Map, MapSource, MapLayer, MapTooltip } from '@onsvisual/svelte-maps';
	import tilebelt from "@mapbox/tilebelt";
	import MapCount from "./MapCount.svelte";
	import MapCodes from "./MapCodes.svelte";
	import Icon from "./Icon.svelte";
	import { getData, getColor, getCentroid, setUnion, setDifference, sleep } from "./utils";
	import { colors, dataurl, datasets, boundSources, dotSources, baseMaps, bounds, layerNames } from "./config";
	
	// Bindings
	let map = null;
	let mapCodes = {};
	let h, w;

	// Data
	const layers = Object.keys(layerNames);
	let data = {};
	let data_lookup = {};
	let data_quads = {};
	let breaks = {};
	let quads = {};
	let centroids; // Centroids for OA quads (used to calculate which layer to display)

	// State
	let dataset = datasets[0];
	let hovered;
	let selected;
	let count = 0; // Number of OA quads in view
	let loaded = 0; // Number of areas data has been loaded
	let requested = 0; // Number of source data files requested
	let files = 0; // Number of source data files loaded
	let dots = 0; // Number of dots in view (only for logging purposes)
	let active = "lad"; // Active layer
	let visible = {};
	let zoom;

	// Get data quads
	fetch("./data/quads.json")
	.then(res => res.json())
	.then(json => {
		for (const key in json) {
			let features = json[key].map(d => ({
				type: "Feature",
				geometry: tilebelt.tileToGeoJSON(d),
				properties: {
					code: d.join("-")
				}
			}));
			quads[key] = {
				type: "FeatureCollection",
				features
			};
			if (key == "oa") {
				centroids = {
					type: "FeatureCollection",
					features: features.map(d => getCentroid(d))
				};
				count = features.length;
			}
		}
	});

	function doHover(e) {
		let feature = e.detail.feature ? e.detail.feature : null;
		hovered = feature ? {key: feature.properties.areacd, label: feature.properties.hclnm ? feature.properties.hclnm : feature.properties.areanm ? feature.properties.areanm : feature.properties.areacd} : null;
	}

	function doSelect(e) {
		let feature = e.detail.feature ? e.detail.feature : null;
		selected = feature ? {key: feature.properties.areacd, label: feature.properties.hclnm ? feature.properties.hclnm : feature.properties.areanm ? feature.properties.areanm : feature.properties.areacd} : null;

		let source = map.getSource("selected");
		if (selected && source) {
			fetch(`https://raw.githubusercontent.com/bothness/geo-bounds/main/output/${selected.key}.geojson`)
			.then(res => res.json())
			.then(json => {
				source.setData(json);

				let bounds = [[json.properties.minx, json.properties.miny], [json.properties.maxx, json.properties.maxy]];
				map.fitBounds(bounds, {padding: 80});
			});
		}
	}

	function unSelect() {
		selected = null;
		let source = map.getSource("selected");
		if (source) source.setData({type: 'FeatureCollection', features: []});
	}

	// Get LAD data for map
	function preloadData() {
		layers.forEach(key => {
			if (!visible[key + '-bounds']) visible[key + '-bounds'] = key == active;
			if (!visible[key + '-dots']) visible[key + '-dots'] = key == active;
			
			if (key == "lad") {
				requested += 1;

				getData(`${dataurl}${key}2021_${dataset.key}-value-2011.csv`)
				.then(arr => {
					let cols = dataset.cols.map(col => col.key);

					let data_ew = {};
					let sum_ew = 0;
					for (const col of cols) {
						data_ew[col] = 0;
					}
					
					arr.forEach(d => {
						let sum = 0;
						let brks = [];
						for (const col of cols) {
							sum += d[col];
							brks.push(sum);
							data_ew[col] += d[col];
							sum_ew += d[col];
						}
						for (const col of cols) {
							d[col + "_perc"] = (100 * d[col]) / sum;
						}
						breaks[d.geocode] = brks;
						data_lookup[d.geocode] = d;
					});

					for (const col of cols) {
						data_ew[col + "_perc"] = (100 * data_ew[col]) / sum_ew;
					}

					data[key] = arr;
					data_lookup.ew = data_ew;
					loaded += arr.length;
					files += 1;
				});
			} else {
				data[key] = [];
				data_quads[key] = new Set([]);
			}
		});
	}

	async function loadData(e, key) {
		await sleep(50);

		if (key == active) {
			let cols = dataset.cols.map(col => col.key);
			let codes = new Set(e.detail.codes);
			let diff = setDifference(codes, data_quads[key]);
			data_quads[key] = setUnion(data_quads[key], codes);

			diff.forEach(code => {
				requested += 1;
				getData(`${dataurl}${key}2011-${code}_${dataset.key}-value-2011.csv`)
				.then(arr => {
					arr.forEach(d => {
						let sum = 0;
						let brks = [];
						for (const col of cols) {
							sum += d[col];
							brks.push(sum);
						}
						for (const col of cols) {
							d[col + "_perc"] = (100 * d[col]) / sum;
						}
						breaks[d.geocode] = brks;
						data_lookup[d.geocode] = d;
					});

					data[key].push(...arr);
					data[key] = [...data[key]]; // Force svelte to refresh
					loaded += arr.length;
					files += 1;
				});
			});
			return true;
		} else {
			return null;
		}
	}

	function toggleLayers(count) {
		if (map) {
			let newactive = count * 1e6 / (w * h) > 40 ? "lad" : count * 1e6 / (w * h) > 3 ? "msoa" : "oa";
			if (newactive != active) {
				layers.forEach(key => {
					visible[key + "-bounds"] = key == newactive;
					visible[key + "-dots"] = key == newactive;
				});
				active = newactive;
			}
		}
	}
	$: toggleLayers(count);

	async function updateDotsAll() {
		sleep(250);
		
		let source = active + '-dots';
		let features = map.queryRenderedFeatures({layers: [source]});
		let dot_id = dotSources.find(d => d.id.split('-')[0] == active).promoteId;

		if (dots != features.length) {
			dots = features.length;
			console.log(`updating all ${dots} visible dots`);

			updateDots(source, features.map(f => f.properties[dot_id]));
		}
	}

	function updateDotsList(source, codes) {
		console.log(`updating ${codes.length} dots`);

		updateDots(source, codes);
	}

	function updateDots(source, ids) {
		for (const id of ids) {
			let area = id.slice(0, 9);
			let dot = +id.slice(9);
			let brks = breaks[area];

			map.setFeatureState({
				source: source,
				sourceLayer: 'oa11dots',
				id
			}, {
				color: brks ? getColor(dot, brks, colors.cat) : "rgba(255,255,255,0)"
			});
		}
	} 

	// function loadedUpdateDots(requested, files) {
	// 	if (requested > 0 && files == requested) {
	// 		map.once('idle', updateDots);
	// 	}
	// }
	// $: loadedUpdateDots(requested, files); // Method for updating dots only when all pending data files are loaded

	async function updateDataset() {
		data = {};
		data_lookup = {};
		data_quads = {};
		breaks = {};
		loaded = 0;
		requested = 0;
		files = 0;

		preloadData();
		if (['oa', 'msoa'].includes(active)) {
			mapCodes[active].getCodes();
		}
	}

	async function getTiles(e) {
		await sleep(250);

		let source = e.sourceId;
		if (e.dataType == "source" && e.coord && ["lad-dots", "msoa-dots", "oa-dots"].includes(source)) {
			let result = [];
			let tile_id = e.coord.canonical.key;
			let tile = map.style.sourceCaches[source]._tiles[tile_id];
			if (tile) {
				tile.querySourceFeatures(result, ({sourceLayer: "oa11dots", validate: false}));
				updateDotsList(source, result.map(feature => feature.id));
			}
		}
	}

	// INITIALISE APP
	preloadData();
	
</script>

<aside>
	<h1>Dot density map test</h1>
	<p>
		<strong>{layerNames[active]} layer visible</strong><br/>
		Data loaded for {loaded.toLocaleString()} areas from {files.toLocaleString()} data {files == 1 ? 'file' : 'files'}<br/>
		{count.toLocaleString()} OA quad centoids in view
	</p>
	<h2>
		{hovered ? hovered.label : selected ? selected.label : 'England and Wales'}
		{#if selected && !hovered}<button class="btn-close text-sml" on:click={unSelect}><Icon type="close"/></button>{/if}
	</h2>
	{#if data_lookup.ew && data_lookup.ew[dataset.cols[0].key]}
	<table class="chart">
		<tbody>
			{#each dataset.cols as col, i}
			<tr class="text-sml">
				<td>{col.label}</td>
			</tr>
			<tr>
				<td class="chart-bar-group">
					{#if hovered && data_lookup[hovered.key]}
					<div class="chart-bar" style:width="{data_lookup[hovered.key][col.key + '_perc']}%" style:background-color="{colors.cat[i]}"/>
					{:else if selected && data_lookup[selected.key]}
					<div class="chart-bar" style:width="{data_lookup[selected.key][col.key + '_perc']}%" style:background-color="{colors.cat[i]}"/>
					{:else}
					<div class="chart-bar" style:width="{data_lookup.ew[col.key + '_perc']}%" style:background-color="{colors.cat[i]}"/>
					{/if}
					<div class="chart-marker" style:left="{data_lookup.ew[col.key + '_perc']}%" style:background-color="black"/>
				</td>
				<td class="chart-num bold">{hovered && data_lookup[hovered.key] ? data_lookup[hovered.key][col.key + '_perc'].toFixed(1) : selected && data_lookup[selected.key] ? data_lookup[selected.key][col.key + '_perc'].toFixed(1) : data_lookup.ew[col.key + '_perc'].toFixed(1)}%</td>
				<td class="chart-num text-sml">({data_lookup.ew[col.key + '_perc'].toFixed(1)}%)</td>
			</tr>
			{/each}
		</tbody>
	</table>
	{/if}
	<p>1 dot = {zoom <= 13 ? Math.pow(2, 16 - Math.floor(zoom)) : 8} {dataset.unit}</p>
	<p><strong>Select a dataset</strong></p>
	{#each datasets as ds}
	<label><input type="radio" name="dataset" value={ds} bind:group={dataset} on:change={updateDataset}/> {ds.label}</label>
	{/each}
</aside>

<main bind:clientHeight={h} bind:clientWidth={w}>
	<Map id="map" style={baseMaps.onsMask} location={{bounds: bounds.ew}} maxzoom={14} bind:map bind:zoom controls={true} on:load={() => { map.on('moveend', () => map.once('idle', updateDotsAll)); map.on('sourcedata', (e) => getTiles(e)); }}>
		{#each boundSources as source}
		<MapSource {...source}>
			<MapLayer
				id="{source.id}-fill"
				type="fill"
				paint={{
					'fill-color': 'rgba(255,255,255,0)'
				}}
				filter={source.id == 'lad-bounds' ? ["all", ["==", "lower", "true"], ["in", "country", "E", "W"]] : null}
				visible={visible[source.id]}
				hover on:hover={doHover}
				select on:select={doSelect}/>
			<MapLayer
				id="{source.id}-line"
				type="line"
				paint={{
					'line-color': ['case',
						['==', ['feature-state', 'hovered'], true], 'orange',
						'rgba(255,255,255,0.25)'
					],
					'line-width': ['case',
						['==', ['feature-state', 'hovered'], true], 2,
						0.5
					]
				}}
				filter={source.id == 'lad-bounds' ? ["all", ["==", "lower", "true"], ["in", "country", "E", "W"]] : null}
				visible={visible[source.id]}
				order="boundary_country"/>
		</MapSource>
		{/each}
		{#if data.lad}
		{#each dotSources as source}
		<MapSource {...source}>
			<MapLayer
				id="{source.id}"
				type="circle"
				paint={{
					'circle-color':
						['case',
							['!=', ['feature-state', 'color'], null],
							['feature-state', 'color'],
							'rgba(255,255,255,0)'
						],
					'circle-radius':
						['interpolate', ['linear'], ['zoom'], 5, 0.7, 8, 1, 12, 1.4, 14, 1.8],
					'circle-opacity': 0.7
				}}
				visible={visible[source.id]}
				order="boundary_country"/>
		</MapSource>
		{/each}
		{/if}
		<MapSource id="selected" type="geojson" data={{'type': 'FeatureCollection', 'features': []}}>
			<MapLayer id="selected" type="line" paint={{'line-color': 'white', 'line-width': 2.5}}/>
		</MapSource>
		{#each ['msoa', 'oa'] as key}
		{#if quads[key]}
		<MapSource id="{key}-quads" type="geojson" data={quads[key]}>
			<MapLayer id="{key}-quads" type="line" paint={{'line-color': 'rgba(255,255,255,0)'}}>
				<MapCodes on:newcodes={e => loadData(e, key)} bind:this={mapCodes[key]}/>
			</MapLayer>
		</MapSource>
		{/if}
		{/each}
		{#if centroids}
		<MapSource id="centroids" type="geojson" data={centroids}>
			<MapLayer id="centroids" type="circle" paint={{'circle-color': 'rgba(255,255,255,0)'}}>
				<MapCount bind:count/>
			</MapLayer>
		</MapSource>
		{/if}
	</Map>
</main>

<style>
	:global(body) {
		position: relative;
		margin: 0;
		padding: 0;
	}
	:global(*) {
		box-sizing: border-box;
	}
	main {
		position: fixed;
		top: 0;
		right: 0;
		width: calc(100% - 400px);
		height: 100vh;
	  margin: 0;
	  padding: 0;
	}
	aside {
		position: absolute;
		z-index: 10;
		top: 0;
		left: 0;
		width: 400px;
		height: 100vh;
	  margin: 0;
		padding: 20px;
		background-color: white;
		overflow-y: auto;
	}
	h1 {
		font-size: 2em;
		margin: 5px 0 10px 0;
	}
	h2 {
		font-size: 1.5em;
		margin: 0 0 5px 0;
	}
	.chart {
		width: 100%;
		border-collapse: collapse;
	}
	.chart-bar-group {
		width: auto;
		position: relative;
	}
	.chart-bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
	}
	.chart-marker {
		position: absolute;
		top: 0;
		height: 100%;
		width: 3px;
		transform: translateX(-50%);
	}
	.chart-num {
		width: 60px;
	}
	.bold {
		font-weight: bold;
	}
	.text-sml {
		font-size: 0.9rem;
	}
	.btn-close {
		margin: 0 0 -5px 0;
		padding: 2px 4px;
		cursor: pointer;
		transform: translateY(-4px);
	}
	@media (max-width: 799px) {
		main {
			width: 100%;
			height: 70vh;
			margin: 0;
			padding: 0;
		}
		aside {
			top: 70vh;
			width: 100%;
			height: fit-content;
			overflow-y: none;
		}
	}
</style>
