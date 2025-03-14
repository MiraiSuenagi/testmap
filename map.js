// Инициализация карты
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.markerClusterGroup({
    maxClusterRadius: 30,
    disableClusteringAtZoom: 10
});

var schoolData = []; // Хранение всех данных

// Функция для загрузки и отображения школ
function loadSchools(year) {
    markers.clearLayers(); // Очистка карты
    let filteredData = schoolData.filter(school => school.properties.completed <= year);

    filteredData.forEach(school => {
        console.log(school.properties); // Проверяем, какие данные есть

        var schoolIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
            iconSize: [20, 20]
        });

        var marker = L.marker([school.geometry.coordinates[1], school.geometry.coordinates[0]], { icon: schoolIcon })
            .bindPopup(`<b>${school.properties.name}</b><br>Год постройки: ${school.properties.completed}`);

        markers.addLayer(marker);
    });

    map.addLayer(markers);
}

// Загрузка данных
fetch('schools.json')
    .then(response => response.json())
    .then(data => {
        schoolData = data;
        console.log(schoolData); // Проверяем структуру данных
        loadSchools(2024); // Начальный год
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

// Обработка изменения ползунка
document.getElementById('timeline-slider').addEventListener('input', function () {
    let selectedYear = parseInt(this.value);
    loadSchools(selectedYear);
});
