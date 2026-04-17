const PH_CENTER = [12.8797, 121.7740];
const PH_ZOOM = 6;

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  }
);

const streetLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }
);

const map = L.map("map", {
  center: PH_CENTER,
  zoom: PH_ZOOM,
  layers: [satelliteLayer],
  zoomControl: true,
});

L.control
  .layers(
    { Satellite: satelliteLayer, Street: streetLayer },
    {},
    { position: "topright", collapsed: false }
  )
  .addTo(map);

console.log("infra map: leaflet initialised");

const COLORS = {
  green: "#22c55e",
  amber: "#f59e0b",
  blue:  "#3b82f6",
};

function bucketFor(isoDate) {
  const target = new Date(isoDate);
  const now = new Date();
  const yearsOut = (target - now) / (1000 * 60 * 60 * 24 * 365.25);
  if (yearsOut <= 1) return "green";
  if (yearsOut <= 3) return "amber";
  return "blue";
}

const projectLayer = L.layerGroup().addTo(map);
let allProjects = [];
const layerByProjectId = new Map();

function renderProject(project) {
  const bucket = bucketFor(project.estimated_completion);
  const color = COLORS[bucket];

  const styleLine = {
    color,
    weight: 4,
    opacity: 0.95,
  };

  let layer;
  if (project.geometry.type === "LineString") {
    const latlngs = project.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    layer = L.polyline(latlngs, styleLine);
  } else if (project.geometry.type === "MultiLineString") {
    const latlngs = project.geometry.coordinates.map((line) =>
      line.map(([lon, lat]) => [lat, lon])
    );
    layer = L.polyline(latlngs, styleLine);
  } else if (project.geometry.type === "Point") {
    const [lon, lat] = project.geometry.coordinates;
    layer = L.circleMarker([lat, lon], {
      radius: 8,
      color: "#fff",
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95,
    });
  } else {
    console.warn("Unsupported geometry type:", project.geometry.type, project.id);
    return null;
  }

  layer.bindTooltip(project.name, { sticky: true, direction: "top" });
  layer.on("mouseover", () => {
    if (layer.setStyle) layer.setStyle({ weight: 6 });
  });
  layer.on("mouseout", () => {
    if (layer.setStyle) layer.setStyle({ weight: 4 });
  });

  layer._project = project;
  layer._bucket = bucket;
  projectLayer.addLayer(layer);
  layerByProjectId.set(project.id, layer);
  return layer;
}

async function loadProjects() {
  const res = await fetch("data/projects.json");
  if (!res.ok) {
    console.error("Failed to load projects.json:", res.status);
    return;
  }
  allProjects = await res.json();
  allProjects.forEach(renderProject);
  console.log(`infra map: loaded ${allProjects.length} projects`);
}

loadProjects();
