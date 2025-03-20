// Инициализация карты
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
var schoolData = [];
var selectedRegion = "all"; // Выбранный регион

// Автоматическое движение ползунков
let playing = true;
let yearSlider = document.getElementById('timeline-slider');
let monthSlider = document.getElementById('month-slider');

if (!yearSlider || !monthSlider) {
    console.error("Ошибка: Ползунки не найдены! Проверь ID элементов в HTML.");
} else {
    let currentYear = parseInt(yearSlider.value);
    let maxYear = parseInt(yearSlider.max);
    let currentMonth = parseInt(monthSlider.value);

    function autoPlaySlider() {
        let interval = setInterval(() => {
            if (!playing) return;

            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
            if (currentYear > maxYear) {
                currentYear = parseInt(yearSlider.min);
            }

            monthSlider.value = currentMonth;
            yearSlider.value = currentYear;
            loadSchools(); // Обновляем карту
        }, 1000);
    }

    autoPlaySlider();
}

// Функция обновления информации в карточке
function updateSchoolInfo(filteredData) {
    document.getElementById("total-schools").textContent = schoolData.length;
    document.getElementById("filtered-schools").textContent = filteredData.length;

    let schoolList = document.getElementById("school-list");
    schoolList.innerHTML = "";

    if (filteredData.length === 0) {
        schoolList.innerHTML = "<p>Нет школ в этом регионе.</p>";
    } else {
        filteredData.forEach(school => {
            let schoolItem = document.createElement("div");
            schoolItem.textContent = school.properties.name;
            schoolList.appendChild(schoolItem);
        });
    }
}

// Функция загрузки и отображения школ
// Функция загрузки и отображения школ
function loadSchools() {
    if (!yearSlider || !monthSlider) return;

    let year = parseInt(yearSlider.value);
    let month = parseInt(monthSlider.value);
    markers.clearLayers();

    let filteredData = schoolData.filter(school => {
        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));
        if (selectedRegion !== "all" && school.properties.region !== selectedRegion) return false;
        return true; // Показываем все объекты
    });

    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);
    
    let greenSchoolsCount = 0; // Счетчик зеленых маркеров
    let schoolCounts = {};
    
    filteredData.forEach(school => {
        let coords = school.geometry.coordinates.join(',');
        if (!schoolCounts[coords]) {
            schoolCounts[coords] = [];
        }
        schoolCounts[coords].push(school);
    });

    Object.keys(schoolCounts).forEach(coords => {
        let [lng, lat] = coords.split(',').map(Number);
        let count = schoolCounts[coords].length;
        let schoolNames = schoolCounts[coords].map(s => s.properties.name).join("<br>");

        var currentDate = new Date(year, month - 1);
        var completedDate = new Date(String(schoolCounts[coords][0].properties.completed).replace(".0", "-01-01")); 

        var markerColor = completedDate <= currentDate ? "#28a745" : "#dc3545"; // Зеленый если завершено, иначе красный

        if (markerColor === "#28a745") {
    greenSchoolsCount += count; // Учитываем все завершенные школы в маркере
}

        var circle = L.circleMarker([lat, lng], {
            radius: 8 + count * 2,
            fillColor: markerColor,
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            interactive: true
        }).bindPopup(`<b>Школы:</b><br>${schoolNames}`);

        markers.addLayer(circle);
    });

    map.addLayer(markers);

    // Обновляем количество завершенных школ
    document.getElementById("filtered-schools").textContent = greenSchoolsCount;

}

// Фильтр по регионам
function applyRegionFilter() {
    selectedRegion = document.getElementById("region-select").value;
    loadSchools();
}

function resetFilters() {
    selectedRegion = "all";
    loadSchools();
}

// Загрузка данных
fetch('schools.json')
    .then(response => response.json())
    .then(data => {
        schoolData = data;
        console.log("Данные школ загружены:", schoolData);
        document.getElementById("total-schools").textContent = schoolData.length;
        loadSchools();
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

if (yearSlider && monthSlider) {
    yearSlider.addEventListener('input', () => {
        currentYear = parseInt(yearSlider.value);
        loadSchools();
    });

    monthSlider.addEventListener('input', () => {
        currentMonth = parseInt(monthSlider.value);
        loadSchools();
    });
}

// Кнопка паузы/старта
let toggleButton = document.getElementById("toggleAnimation");
if (toggleButton) {
    toggleButton.addEventListener("click", function () {
        playing = !playing;
        this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
    });
}

document.getElementById("region-select").addEventListener("change", applyRegionFilter);
