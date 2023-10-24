var geoserverUrl = "http://192.168.0.16:8080/geoserver";
var selectedPoint = null;

var source = null;
var target = null;

// initialize our map
var map = L.map("map", {
	center: [19.432241, -99.177254],
	zoom: 13 //set the zoom level
});

//add openstreet map baselayer to the map
var OpenStreetMap = L.tileLayer(
	"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	{
		maxZoom: 19,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}
).addTo(map);
function initRouting() {
	// empty geojson layer for the shortes path result
	var pathLayer = L.geoJSON(null);
	var shortesPathLayer = L.geoJSON(null);
	map.addLayer(pathLayer);

	// draggable marker for starting point. Note the marker is initialized with an initial starting position
	map.on('click', function (evt) {
		if (pathLayer.getLayers().length < 2) {
			//var marselect = evt.latlng;
			console.log(evt);
			var url = [
				'images/start.png',
				'images/end.png'
			];
			for (var i = 0; i < pathLayer.getLayers().length; i++) {

			}
			var iconOptions = {
				iconUrl: url[i],
				iconAnchor: [15, 30],
				iconSize: [30, 30]
			}
			// Creating a custom icon
			var customIcon = L.icon(iconOptions);

			// Creating Marker Options
			var markerOptions = {
				icon: customIcon,
				draggable: true
			}
			var marker = L.marker(evt.latlng, markerOptions).addTo(pathLayer);
			//console.log(i)

			var sourceMarker = pathLayer.getLayers()[0];
			var targetMarker = pathLayer.getLayers()[1]
			//console.log(sourceMarker.getLatLng())
			marker.on('dragend', function (e) {
				//console.log(e.target.getLatLng());
				selectedPoint = e.target.getLatLng();
				getVertex(selectedPoint);
				getRoute();
			})
			/*sourceTarget.on('dragend', function (e) {
				selectedPoint = e.target.getLatLng();
	
				getVertex(selectedPoint);
				getRoute();
			})
			targetMarker.on('dragend', function (e) {
				selectedPoint = e.target.getLatLng();
				getVertex(selectedPoint);
				getRoute();
			})*/
			// function to get nearest vertex to the passed point
			function getVertex(selectedPoint){
				//console.log(selectedPoint)
				var url =`${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${selectedPoint.lng};y:${selectedPoint.lat};`;
				console.log(url)
				$.ajax({
					url: url,
					async: false,
					success: function (data) {
						loadVertex(
							data,
							selectedPoint.toString() === sourceMarker.getLatLng().toString()
						);
					}
				});
			};

			// function to update the source and target nodes as returned from geoserver for later querying
			function loadVertex(response, isSource) {
				var features = response.features;
				//console.log(features[0].properties.id)
				//console.log(isSource)
				map.removeLayer(shortesPathLayer);
				if (isSource) {
					source = features[0].properties.id;
					//console.log('Source: 'source)
				} else {
					target = features[0].properties.id;
					//console.log('Target: 'target)
				}
			};

			// function to get the shortest path from the give source and target nodes
			function getRoute() {
				var url=`${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;
				//console.log(url)
				$.getJSON(url, function (data) {
					map.removeLayer(shortesPathLayer);
					shortesPathLayer = L.geoJSON(data);
					map.addLayer(shortesPathLayer);
				});
			};
			//console.log(pathLayer.getLayers()[0])

			if (sourceMarker && targetMarker) {
				getVertex(sourceMarker.getLatLng());
				getVertex(targetMarker.getLatLng());
				getRoute();
			}
		}

	});
	var tooltip = L.tooltip()
	map.on('mousemove', function (evt) {
		if (evt.latlng) {
			tooltip.setLatLng(evt.latlng).setContent('Marcar Punto de inicio').addTo(map)
			if (pathLayer.getLayers()[0]) {
				tooltip.setContent('Marcar Punto de destino')
				if (pathLayer.getLayers().length == 2) {
					map.removeLayer(tooltip);
				}
			}
		}
	});
	$('#clean').click(function () {
		
		map.removeLayer(pathLayer);
		map.removeLayer(shortesPathLayerM);
		//initRouting()
	});
}




//initRouting()


