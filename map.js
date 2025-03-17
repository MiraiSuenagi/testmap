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
function loadSchools() {
    let year = parseInt(yearSlider.value);
   let month = parseInt(monthSlider.value) - 1; // Январь 2024 = 0, Январь 2026 = 12
let year = 2024 + Math.floor(month / 12);
month = month % 12;

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
            radius: 8 + count * 2,
            fillColor: "#28a745",
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
        autoPlaySlider(); // Запускаем анимацию после загрузки данных
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

// Обработка изменения ползунков
yearSlider.addEventListener('input', () => {
    currentYear = parseInt(yearSlider.value);
    loadSchools();
});

monthSlider.addEventListener('input', () => {
    currentMonth = parseInt(monthSlider.value);
    loadSchools();
});

// Добавляем обработчик для кнопки паузы/старта
document.getElementById("toggleAnimation").addEventListener("click", function () {
    playing = !playing;
    this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
});
document.getElementById("region-select").addEventListener("change", applyRegionFilter);
