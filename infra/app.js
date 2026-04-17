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

  layer.on("click", (ev) => {
    L.DomEvent.stopPropagation(ev);
    highlight(layer);
    renderDetail(project, bucket);
  });

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

const detailPanel = document.getElementById("detail-panel");
const detailContent = document.getElementById("detail-content");
const detailClose = document.getElementById("detail-close");

const STATUS_LABELS = {
  approved: "Approved",
  under_construction: "Under Construction",
  partially_operational: "Partially Operational",
};

const BUCKET_LABELS = {
  green: "≤ 1 year",
  amber: "1–3 years",
  blue: "3+ years",
};

const TYPE_LABELS = {
  road: "Road",
  bridge: "Bridge",
  expressway: "Expressway",
  rail: "Rail",
  airport: "Airport",
  seaport: "Seaport",
};

function fmtCost(billions) {
  if (billions == null) return "—";
  return `₱${billions.toLocaleString("en-PH", { maximumFractionDigits: 1 })}B`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long" });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function renderDetail(project, bucket) {
  detailContent.innerHTML = `
    <h2>${escapeHtml(project.name)}</h2>
    <div class="badges">
      <span class="badge">${escapeHtml(STATUS_LABELS[project.status] || project.status)}</span>
      <span class="badge bucket-${bucket}">${BUCKET_LABELS[bucket]}</span>
      <span class="badge">${escapeHtml(TYPE_LABELS[project.type] || project.type)}</span>
      <span class="badge">${escapeHtml(project.funding_modality)}</span>
    </div>
    <dl>
      <dt>Implementing agency</dt><dd>${escapeHtml(project.implementing_agency)}</dd>
      ${project.concessionaire ? `<dt>Concessionaire</dt><dd>${escapeHtml(project.concessionaire)}</dd>` : ""}
      <dt>Region</dt><dd>${escapeHtml(project.region)}</dd>
      <dt>Provinces</dt><dd>${escapeHtml(project.provinces.join(", "))}</dd>
      <dt>Target completion</dt><dd>${fmtDate(project.estimated_completion)} <small>(${escapeHtml(project.completion_confidence.replace(/_/g, " "))})</small></dd>
      <dt>Cost</dt><dd>${fmtCost(project.cost_php_billions)}</dd>
    </dl>
    <p class="description">${escapeHtml(project.description)}</p>
    <h3>Sources</h3>
    <ul class="sources">
      ${project.sources.map(s => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a></li>`).join("")}
    </ul>
    <p class="updated">Last updated ${escapeHtml(project.last_updated)}</p>
  `;
  detailPanel.classList.remove("hidden");
}

let highlightedLayer = null;

function highlight(layer) {
  if (highlightedLayer && highlightedLayer.setStyle) {
    highlightedLayer.setStyle({ weight: 4 });
  }
  if (layer.setStyle) layer.setStyle({ weight: 8 });
  highlightedLayer = layer;
}

function clearHighlight() {
  if (highlightedLayer && highlightedLayer.setStyle) {
    highlightedLayer.setStyle({ weight: 4 });
  }
  highlightedLayer = null;
}

detailClose.addEventListener("click", () => {
  detailPanel.classList.add("hidden");
  clearHighlight();
});
