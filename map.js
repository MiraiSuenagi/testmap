// Инициализация карты
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
var schoolData = [];
var selectedRegion = "all"; // Выбранный регион

// Функция обновления информации в карточке
function updateSchoolInfo(filteredData) {
    document.getElementById("total-schools").textContent = schoolData.length; // Всего школ
    document.getElementById("filtered-schools").textContent = filteredData.length; // Школ в регионе
    
    let schoolList = document.getElementById("school-list");
    schoolList.innerHTML = ""; // Очищаем список перед обновлением

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
function loadSchools(year, month) {
    markers.clearLayers();

    let filteredData = schoolData.filter(school => {
        if (!school.properties.completed) return false;

        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));
        
        // Фильтруем школы, завершенные до текущего месяца
        let isCompleted = completedDate.getFullYear() < year || 
            (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month);
        
        if (!isCompleted) return false;

        // Фильтр по региону
        if (selectedRegion !== "all" && school.properties.region !== selectedRegion) {
            return false;
        }

        return true;
    });

    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);

    updateSchoolInfo(filteredData); // Обновляем карточку

    // Группируем школы по координатам
    let schoolCounts = {};
    filteredData.forEach(school => {
        let coords = school.geometry.coordinates.join(',');
        if (!schoolCounts[coords]) {
            schoolCounts[coords] = [];
        }
        schoolCounts[coords].push(school.properties.name);
    });

    // Добавляем круги с возможностью клика
    Object.keys(schoolCounts).forEach(coords => {
        let [lng, lat] = coords.split(',').map(Number);
        let count = schoolCounts[coords].length;
        let schoolNames = schoolCounts[coords].join("<br>"); // Объединяем все названия школ в одной точке

        var circle = L.circleMarker([lat, lng], {
            radius: 8 + count * 2, // Размер зависит от количества школ
            fillColor: "#28a745", // Зеленый цвет
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            interactive: true
        }).bindPopup(`<b>Школы:</b><br>${schoolNames}`);

        markers.addLayer(circle);
    });

    map.addLayer(markers);
}

// Фильтр по регионам
function applyRegionFilter() {
    selectedRegion = document.getElementById("region-select").value;
    let selectedYear = parseInt(document.getElementById('timeline-slider').value);
    let selectedMonth = parseInt(document.getElementById('month-slider').value);
    loadSchools(selectedYear, selectedMonth);
}

function resetFilters() {
    selectedRegion = "all";
    let selectedYear = parseInt(document.getElementById('timeline-slider').value);
    let selectedMonth = parseInt(document.getElementById('month-slider').value);
    loadSchools(selectedYear, selectedMonth);
}

// Загрузка данных
fetch('schools.json')
    .then(response => response.json())
    .then(data => {
        schoolData = data;
        console.log("Данные школ загружены:", schoolData);
        document.getElementById("total-schools").textContent = schoolData.length; // Устанавливаем общее количество школ
        loadSchools(2024, 1);
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

autoPlaySlider();
document.getElementById("region-select").addEventListener("change", applyRegionFilter);
