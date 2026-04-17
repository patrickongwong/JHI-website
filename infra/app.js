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
