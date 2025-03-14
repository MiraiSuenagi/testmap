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
    let filteredData = schoolData.filter(school => school.properties.completed && Math.floor(school.properties.completed) <= year);

    filteredData.forEach(school => {
        console.log(school.properties); // Проверяем структуру данных

        var schoolIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
            iconSize: [20, 20]
        });

        var marker = L.marker([school.geometry.coordinates[1], school.geometry.coordinates[0]], { icon: schoolIcon })
            .bindPopup(`<b>${school.properties.name}</b><br>Год постройки: ${school.properties.completed ? Math.floor(school.properties.completed) : "Неизвестно"}`);

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

// Автоматическое движение ползунка (анимация)
let yearSlider = document.getElementById('timeline-slider');
let currentYear = parseInt(yearSlider.min);
let maxYear = parseInt(yearSlider.max);

function autoPlaySlider() {
    let interval = setInterval(() => {
        if (currentYear > maxYear) {
            currentYear = parseInt(yearSlider.min); // Вернуться к началу
        }
        yearSlider.value = currentYear;
        yearSlider.dispatchEvent(new Event('input')); // Симулируем ручное нажатие
        currentYear++;
    }, 2000); // Меняем год каждые 2 секунды (можно настроить)
}

autoPlaySlider(); // Запускаем анимацию
