export const colors = {
	seq5: ['rgb(234, 236, 177)', 'rgb(169, 216, 145)', 'rgb(0, 167, 186)', 'rgb(0, 78, 166)', 'rgb(0, 13, 84)'],
	div10: ['#67001f','#b2182b', '#d6604d','#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
	cat: ['#3899c9', '#fb3640', '#fff07c', '#89ffa7', '#e8800c', '#a799b7']
};

export const dataurl = "https://raw.githubusercontent.com/ONSvisual/census-data-v2/main/csv/variable/";

export const datasets = [
	{
		key: "ethnicity",
		label: "Ethnic group",
		unit: "people",
		cols: [
			{key: "white", label: "White"},
			{key: "asian", label: "Asian"},
			{key: "black", label: "Black"},
			{key: "mixed", label: "Mixed"},
			{key: "other", label: "Other"}
		]
	},
	{
		key: "health",
		label: "General health",
		unit: "people",
		cols: [
			{key: "good", label: "Good or very good"},
			{key: "fair", label: "Fair"},
			{key: "bad", label: "Bad or very bad"}
		]
	},
	{
		key: "economic",
		label: "Economic activity",
		unit: "people",
		cols: [
			{key: "employee", label: "Employee"},
			{key: "self-employed", label: "Self-employed"},
			{key: "student", label: "Student (in work)"},
			{key: "unemployed", label: "Unemployed"},
			{key: "inactive", label: "Economically inactive"}
		]
	},
	{
		key: "tenure",
		label: "Housing tenure",
		unit: "households",
		cols: [
			{key: "owned", label: "Owner occupied"},
			{key: "shared_ownership", label: "Shared ownership"},
			{key: "rented_social", label: "Rented (social)"},
			{key: "rented_private", label: "Rented (private)"},
			{key: "rent_free", label: "Rent free"}
		]
	},
];

export const boundSources = [
	{
		id: "lad-bounds",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/authorities/{z}/{x}/{y}.pbf",
		promoteId: "areacd",
		layer: "authority",
		maxzoom: 12
	},
	{
		id: "msoa-bounds",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/msoa/{z}/{x}/{y}.pbf",
		promoteId: "areacd",
		layer: "boundaries",
		maxzoom: 12
	},
	{
		id: "oa-bounds",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/oa/{z}/{x}/{y}.pbf",
		promoteId: "areacd",
		layer: "boundaries",
		maxzoom: 12
	}
];

export const dotSources = [
	{
		id: "lad-dots",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/dots/v1/{z}/{x}/{y}.pbf",
		promoteId: "lad21cd",
		layer: "oa11dots",
		maxzoom: 13
	},
	{
		id: "msoa-dots",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/dots/v1/{z}/{x}/{y}.pbf",
		promoteId: "msoa11cd",
		layer: "oa11dots",
		maxzoom: 13
	},
	{
		id: "oa-dots",
		type: "vector",
		url: "https://cdn.jsdelivr.net/gh/bothness/map-tiles/dots/v1/{z}/{x}/{y}.pbf",
		promoteId: "oa11cd",
		layer: "oa11dots",
		maxzoom: 13
	}
];
	
export const baseMaps = {
	'osm': 'https://onsvisual.github.io/svelte-maps/data/style-osm.json',
	'osmGrey': 'https://onsvisual.github.io/svelte-maps/data/style-osm-grey.json',
	'ons': 'https://onsvisual.github.io/svelte-maps/data/style-ons-light.json',
	'onsMask': './data/style.json'
}

export const bounds = {
	uk: [[ -9, 49 ], [ 2, 61 ]],
	ew: [[-6, 49], [2, 56]]
};

export const layerNames = {
	lad: "Districts",
	msoa: "MSOA",
	oa: "OA"
}