// Инициализация карты
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загрузка данных о школах
fetch('schools.json')
    .then(response => response.json())
    .then(data => {
        var markers = L.markerClusterGroup({
            maxClusterRadius: 30, // Уменьшаем радиус кластеров
            disableClusteringAtZoom: 10 // Показываем школы отдельно при увеличении
        });

        data.forEach(school => {
            var schoolIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png', // Компактная иконка
                iconSize: [20, 20]
            });

            var marker = L.marker([school.lat, school.lng], { icon: schoolIcon })
                .bindPopup(`<b>${school.name}</b><br>Год постройки: ${school.year}`);

            markers.addLayer(marker);
        });

        map.addLayer(markers);

        // Динамическое отключение кластеров при увеличении зума
        map.on('zoomend', function () {
            if (map.getZoom() > 8) {
                markers.options.disableClusteringAtZoom = 8;
            } else {
                markers.options.disableClusteringAtZoom = 10;
            }
        });
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));