import { csvParse, autoType } from 'd3-dsv';
import { feature } from 'topojson-client';
import ckmeans from 'ckmeans';

export async function getData(url) {
  let response = await fetch(url);
  let string = await response.text();
	let data = await csvParse(string, autoType);
  return data;
}

export async function getTopo(url, layer) {
  let response = await fetch(url);
  let json = await response.json();
  let geojson = await feature(json, layer);
  return geojson;
}

export function getColor(val, breaks, colors) {
  for (let i = 0; i < breaks.length; i ++) {
    if (val <= breaks[i]) {
      return colors[i];
    }
  }
  return "rgba(255,255,255,0)";
}

export function getBreaks(vals, count=5) {
  let len = vals.length;
  let sorted = [...vals].sort((a, b) => a - b);
  let breaks = ckmeans(sorted, count);
	breaks.push(sorted[len - 1]);
	return breaks;
}

export function getCentroid(feature) {
  let coords = feature.geometry.coordinates;
  let x = coords[0].map(d => d[0]);
  let y = coords[0].map(d => d[1]);
  let center = [(Math.max(...x) + Math.min(...x)) / 2, (Math.max(...y) + Math.min(...y)) / 2];
  return {type: "Feature", geometry: {type: "Point", coordinates: center}}
}

export function setUnion(setA, setB) {
  let _union = new Set(setA)
  for (let elem of setB) {
      _union.add(elem)
  }
  return _union
}

export function setDifference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
      _difference.delete(elem)
  }
  return _difference
}

export function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}