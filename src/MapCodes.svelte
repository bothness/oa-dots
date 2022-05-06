<script>
	import { getContext, onMount, createEventDispatcher } from 'svelte';

  export let key = "code";

	const dispatch = createEventDispatcher();
	
  const { layer } = getContext('layer');
	const { getMap } = getContext('map');
	const map = getMap();

  export async function getCodes() {
    if (map.getLayer(layer)) {
      let features = map.queryRenderedFeatures({layers: [layer]});
      if (features[0] && features[0].properties[key]) {
        let codes = features.map(f => f.properties[key]);
        
        dispatch('newcodes', {codes});
        return codes;
      } else {
        return null;
      }
    }
  }

  onMount(() => {
		map.on('move', () => {
      getCodes();
    });
	});
  
</script>