// Declaración de variables y constantes
//const geoserverUrl = 'http//localhost:8080/geoserver';
const map = L.map('map').setView([40.7128, -74.0060], 13);
const layerGroup = L.layerGroup().addTo(map);
const tooltip = L.tooltip();
const shortesPathLayer = L.geoJson();
const arrayToVertex = [];
const targetM = [];
let sourceM = null;
let selectPoint = null;

// Función para cargar el archivo CSV
async function loadCsv(file) {
  try {
    const text = await file.text();
    const geoJson = geojson.parse(text, { delimiter: ',' });
    geoJson.features.forEach(feature => {
      switch (feature.geometry.type) {
        case 'Point':
          const marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
          marker.bindPopup(feature.properties.name);
          map.addLayer(marker);
          break;
        case 'LineString':
          const polyline = L.polyline(feature.geometry.coordinates, {
            color: 'blue',
            weight: 2,
            opacity: 0.5
          });
          polyline.bindPopup(feature.properties.name);
          map.addLayer(polyline);
          break;
        case 'Polygon':
          const polygon = L.polygon(feature.geometry.coordinates, {
            color: 'blue',
            weight: 2,
            opacity: 0.5
          });
          polygon.bindPopup(feature.properties.name);
          map.addLayer(polygon);
          break;
        default:
          console.log(`Unknown geometry type: ${feature.geometry.type}`);
      }
    });
    map.fitBounds(L.latLngBounds(geoJson.features.map(feature => feature.geometry.bounds)));
    console.log(text);
  } catch (error) {
    console.error(error);
  }
}

// Función para calcular la ruta más corta
function multiPath(arrayToVertex) {
  map.on('mousemove', function(evt) {
    if (evt.latlng) {
      tooltip.setLatLng(evt.latlng).setContent('Marcar Punto de destino').addTo(map);
      if (selectPoint) {
        map.closeTooltip(tooltip);
      }
    }
  });
  map.once('click', function(e) {
    var iconOptions = {
      iconUrl: 'images/end.png',
      iconAnchor: [15, 30],
      iconSize: [30, 30]
    };
    var customIcon = L.icon(iconOptions);
    var markerOptions = {
      icon: customIcon,
      draggable: true
    };
    var markerM = L.marker(e.latlng, markerOptions).addTo(layerGroup);
    markerM.bindPopup('Punto destino').openPopup();
    selectPoint = e.latlng;
    arrayToVertex.push(e.latlng);
    for (let i = 0; i < arrayToVertex.length; i++) {
      var urlLayer = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${arrayToVertex[i].lng};y:${arrayToVertex[i].lat};`;
      $.ajax({
        url: urlLayer,
        async: false,
        success: function(data) {
          loadVertexS(data, selectPoint === arrayToVertex[i]);
        }
      });
    }
  });
}

// Función para cargar los vértices
function loadVertexS(response, isSource) {
  var features = response.features;
  if (isSource) {
    sourceM = features[0].properties.id;
  } else {
    targetM.push(features[0].properties.id);
  }
  var length2 = targetM.length;
  for (var j = 0; j < length2; j++) {
    var urlRoute = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${sourceM};target:${targetM[j]};`;
    $.getJSON(urlRoute, function(data) {
      shortesPathLayer = L.geoJSON(data, {
        onEachFeature: function(data, featureLayer) {
          featureLayer.on('click', function() {
            map.fitBounds(featureLayer.getBounds());
            featureLayer.bindPopup('Distancia: ' + data.properties.distance + ' mts').openPopup();
          });
        }
      });
      layerGroup.addLayer(shortesPathLayer);
    });
  }
}

// Función para limpiar el mapa
function cleanMap() {
  map.eachLayer(function(feature, layer) {
    if (feature.feature || feature._latlng === selectPoint) {
      map.removeLayer(feature);
    }
  });
  targetM.splice(0, targetM.length);
  arrayToVertex.splice(0, arrayToVertex.length);
}

// Eventos
document.getElementById('myFile').oninput = async () => {
  try{
    const file = document.getElementById('myFile').files[0];
    await loadCsv(file);
  } catch (error) {
    console.error(error);
  }
};

$('#clean').click(function() {
  cleanMap();
});
