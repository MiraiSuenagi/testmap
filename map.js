// Инициализация карты
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup(); // Группа для маркеров
var schoolData = []; // Данные о школах

// Функция для загрузки и отображения школ
function loadSchools(year, month) {
    markers.clearLayers(); // Очищаем карту перед добавлением новых точек

    let filteredData = schoolData.filter(school => {
        if (!school.properties.completed) return false;

        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));
        
        // Фильтруем школы, завершенные до текущего месяца
        return (
            completedDate.getFullYear() < year || 
            (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month)
        );
    });

    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);

    // Группируем школы по координатам
    let schoolCounts = {};
    filteredData.forEach(school => {
        let coords = school.geometry.coordinates.join(',');
        if (!schoolCounts[coords]) {
            schoolCounts[coords] = 0;
        }
        schoolCounts[coords]++;
    });

   
    // Добавляем круги без текста
Object.keys(schoolCounts).forEach(coords => {
    let [lng, lat] = coords.split(',').map(Number);
    let count = schoolCounts[coords];

    var circle = L.circleMarker([lat, lng], {
    radius: 8 + count * 2, // Размер зависит от количества школ
    fillColor: "#007bff",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    interactive: false // Отключаем всплывающие подсказки
});


    markers.addLayer(circle);
});

map.addLayer(markers);

}

// Загрузка данных
fetch('schools.json')
    .then(response => response.json())
    .then(data => {
        schoolData = data;
        console.log("Данные школ загружены:", schoolData);
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

// Автоматическое движение ползунков
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

    document.getElementById("toggleAnimation").addEventListener("click", function () {
        playing = !playing;
        this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
    });
}

autoPlaySlider();
