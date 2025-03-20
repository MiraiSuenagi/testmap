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
    function autoPlaySlider() {
        let interval = setInterval(() => {
            if (!playing) return;
            
            let currentYear = parseInt(yearSlider.value);
            let maxYear = parseInt(yearSlider.max);
            let currentMonth = parseInt(monthSlider.value);
            
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
            loadSchools();
        }, 1000);
    }
    autoPlaySlider();
}

// Функция загрузки и отображения школ
function loadSchools() {
    if (!yearSlider || !monthSlider) return;

    let year = parseInt(yearSlider.value);
    let month = parseInt(monthSlider.value);
    markers.clearLayers();

    let currentDate = new Date(year, month - 1);
    
    let filteredData = schoolData.filter(school => {
        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));
        if (selectedRegion !== "all" && school.properties.region !== selectedRegion) return false;
        return true; // Показываем все объекты
    });

    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);
    
    document.getElementById("filtered-schools").textContent = filteredData.length;
    document.getElementById("school-list").innerHTML = "";

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

        let completedDate = new Date(String(schoolCounts[coords][0].properties.completed).replace(".0", "-01-01"));
        let markerColor = completedDate <= currentDate ? "#28a745" : "#dc3545"; // Зеленый - завершенные, красный - еще не построенные

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
    updateSchoolList(filteredData);
}

// Функция обновления списка школ
function updateSchoolList(schools) {
    let schoolList = document.getElementById("school-list");
    schoolList.innerHTML = "";

    if (schools.length === 0) {
        schoolList.innerHTML = "<p>Нет школ в этом регионе.</p>";
    } else {
        schools.forEach(school => {
            let schoolItem = document.createElement("div");
            schoolItem.textContent = school.properties.name;
            schoolList.appendChild(schoolItem);
        });
    }
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
    yearSlider.addEventListener('input', loadSchools);
    monthSlider.addEventListener('input', loadSchools);
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

function switchPage() {
    let selectedPage = document.getElementById("page-select").value;
    window.location.href = selectedPage;
}

document.addEventListener("DOMContentLoaded", function () {
    let pageSelect = document.getElementById("page-select");
    pageSelect.value = window.location.href.includes("page2.html") ? "page2.html" : "index.html";
});
