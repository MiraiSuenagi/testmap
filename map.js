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
function loadSchools(year, month) {
    markers.clearLayers(); // Очистка карты
    
    let filteredData = schoolData.filter(school => {
        if (!school.properties.completed) return false;

        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));
        
        // Теперь школы остаются, если сданы до выбранного месяца
        return (
            completedDate.getFullYear() < year || 
            (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month)
        );
    });
    
    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);

    filteredData.forEach(school => {
        var schoolIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
            iconSize: [20, 20]
        });

        var marker = L.marker([school.geometry.coordinates[1], school.geometry.coordinates[0]], { icon: schoolIcon })
            .bindPopup(`<b>${school.properties.name}</b><br>Год постройки: ${school.properties.completed ? school.properties.completed : "Неизвестно"}`);

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
        loadSchools(2024, 1); // Начальный год и месяц
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

// Обработка изменения ползунков
document.getElementById('timeline-slider').addEventListener('input', function () {
    let selectedYear = parseInt(this.value);
    let selectedMonth = parseInt(document.getElementById('month-slider').value);
    loadSchools(selectedYear, selectedMonth);
});

document.getElementById('month-slider').addEventListener('input', function () {
    let selectedYear = parseInt(document.getElementById('timeline-slider').value);
    let selectedMonth = parseInt(this.value);
    loadSchools(selectedYear, selectedMonth);
});

// Автоматическое движение ползунков (сначала месяцы, потом год)
let yearSlider = document.getElementById('timeline-slider');
let monthSlider = document.getElementById('month-slider');
let currentYear = parseInt(yearSlider.min);
let maxYear = parseInt(yearSlider.max);
let currentMonth = 1;
let playing = true;

function autoPlaySlider() {
    let interval = setInterval(() => {
        if (!playing) return;
        
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        if (currentYear > maxYear) {
            currentYear = parseInt(yearSlider.min);
        }
        monthSlider.value = currentMonth;
        yearSlider.value = currentYear;
        monthSlider.dispatchEvent(new Event('input'));
        yearSlider.dispatchEvent(new Event('input'));
        currentMonth++;
    }, 1000);

    // Кнопка старт/стоп
    document.getElementById("toggleAnimation").addEventListener("click", function () {
        playing = !playing;
        this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
    });
}

autoPlaySlider(); // Запускаем анимацию
