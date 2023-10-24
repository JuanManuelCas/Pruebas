/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var shortesPathLayerM = L.geoJson();
var shortesPathLayerGroup = L.layerGroup();
shortesPathLayerGroup.addTo(map);
var targetM = [];
var sourceM = null;
var arrayToVertex = [];
var selectPoint = null;//L.geoJSON(null);
//map.addLayer(selectPoint);
var tooltip1 = L.tooltip()
var mi_geocsv = L.geoCsv(null, {
	firstLineTitles: true,
	fieldSeparator: ',',
	WKTTitle: 'Feature',
	debug: true,
	onEachFeature: function (feature, layer) {
		var popup = '';
		for (var nom in feature.properties) {
			var title = mi_geocsv.getPropertyTitle(nom);
			popup += '<b>' + title + '</b><br />' + feature.properties[nom] + '<br /><br />';
		}
		layer.bindPopup(popup);
	}
});
//...
var url = document.getElementById('myFile');
url.oninput = async () => {
	try {
		const file = url.files[0]
		const text = await file.text()
		mi_geocsv.addData(text);
		map.addLayer(mi_geocsv);
		map.fitBounds(mi_geocsv.getBounds())
		console.log(text)

		mi_geocsv.eachLayer(function (layer) {
			var lat = layer.getLatLng().lat;
			var lng = layer.getLatLng().lng;
			var latlng = layer.getLatLng();
			//var coord= `${lng}%20${lat}`;
			arrayToVertex.push(latlng);
		})
		multiPath(arrayToVertex);
		$('input[type="file"]').val('');
	} catch (error) {
		console.error(error);
		// handle the error or display an error message to the user
	}
}

function multiPath(arrayToVertex) {
	map.on('mousemove', function (evt) {
		if (evt.latlng) {
			tooltip1.setLatLng(evt.latlng).setContent('Marcar Punto de destino').addTo(map);
			if (selectPoint) {
				map.closeTooltip(tooltip1);
			}
		}
	});
	map.once('click', function (e) {
		//console.log(arrayToVertex)
		var iconOptions = {
			iconUrl: 'images/end.png',
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
		var markerM = L.marker(e.latlng, markerOptions).addTo(mi_geocsv);
		markerM.bindPopup('Punto destino').openPopup();

		selectPoint = e.latlng;
		arrayToVertex.push(e.latlng);
		//var sourceMarker = mi_geocsv.getLayers()[0];

		var length = arrayToVertex.length;
		if (selectPoint/*/.getLayers().length !== 0/*/) {
			for (let i = 0; i < length; i++) {
				var urlLayer = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${arrayToVertex[i].lng};y:${arrayToVertex[i].lat};`;
				$.ajax({
					url: urlLayer,
					async: false,
					success: function (data) {
						loadVertexS(
							data,
							selectPoint === arrayToVertex[i]
						)
					}
				});

				function loadVertexS(response, isSource) {
					var features = response.features;
					//console.log(features)			
					if (isSource) {
						sourceM = features[0].properties.id;
						//console.log(sourceM)
					} else {
						targetM.push(features[0].properties.id);
						//console.log(targetM)
					}
					var length2 = targetM.length;
					for (var j = 0; j < length2; j++) {
						var urlRoute = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${sourceM};target:${targetM[j]};`;
						//console.log('Ruta: '+urlRoute)
						$.getJSON(urlRoute, function (data) {
							//map.removeLayer(shortesPathLayerM);
							shortesPathLayerM = L.geoJSON(data, {
								onEachFeature: function (data, featureLayer) {
									featureLayer.on('click', function () {
										map.fitBounds(featureLayer.getBounds())
										featureLayer.bindPopup('Distancia: ' + data.properties.distance + ' mts').openPopup()
									})
								}
							});
							shortesPathLayerGroup.addLayer(shortesPathLayerM);
						});
					};
				};
			};
		};
	});
};
$('#clean').click(function () {
	map.eachLayer(function(feature, layer){
		if(feature.feature || feature._latlng == selectPoint){
			map.removeLayer(feature);
		}
			
		console.log(feature);
	})
	targetM.splice(0, targetM.length);
	arrayToVertex.splice(0, arrayToVertex.length);
})
