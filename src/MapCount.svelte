<script>
	import { getContext, onMount, createEventDispatcher } from 'svelte';
	
  export let count;
  export let key = null;

  const dispatch = createEventDispatcher();

	const { layer } = getContext('layer');
	const { getMap } = getContext('map');
	const map = getMap();

  function countFeatures() {
    if (map.getLayer(layer)) {
      let features = map.queryRenderedFeatures({layers: [layer]});
      if (features[0] && key) {
        features = features.map(f => f.properties[key]).filter((v, i, a) => a.indexOf(v) === i);
      }
      count = features.length;
    }
    dispatch('moveend', {
			count
		});
  }

  onMount(() => {
		map.on('moveend', () => {
      countFeatures();
    });
    map.on('idle', () => {
      dispatch('idle', {});
    })
	});
  
</script>