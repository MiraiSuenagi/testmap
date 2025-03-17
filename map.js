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
    document.getElementById("total-schools").textContent = filteredData.length; // Отображаем количество отфильтрованных школ

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

// Функция загрузки школ и фильтрации
function loadSchools() {
    let year = parseInt(yearSlider.value);
    let month = parseInt(monthSlider.value);
    markers.clearLayers();

    console.log("Фильтр регионов:", selectedRegion);

    let filteredData = schoolData.filter(school => {
        if (!school.properties.completed) return false;

        let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));

        let isCompleted = completedDate.getFullYear() < year || 
            (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month);

        if (!isCompleted) return false;

        // Извлекаем регион из `name`
        let schoolRegion = extractRegion(school.properties.name);
        console.log(`Школа: ${school.properties.name}, Регион: ${schoolRegion}`);

        if (selectedRegion !== "all" && schoolRegion !== selectedRegion) {
            return false;
        }

        return true;
    });

    console.log(`Школ отфильтровано: ${filteredData.length} за ${year}-${month}`);

    updateSchoolInfo(filteredData);

    let schoolCounts = {};
    filteredData.forEach(school => {
        let coords = school.geometry.coordinates.join(',');
        if (!schoolCounts[coords]) {
            schoolCounts[coords] = [];
        }
        schoolCounts[coords].push(school.properties.name);
    });

    Object.keys(schoolCounts).forEach(coords => {
        let [lng, lat] = coords.split(',').map(Number);
        let count = schoolCounts[coords].length;
        let schoolNames = schoolCounts[coords].join("<br>");

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

// Функция извлечения региона из `name`
function extractRegion(name) {
    let regions = [
        "Абайская область", "Акмолинская область", "Актюбинская область", "Алматинская область",
        "Атырауская область", "Восточно-Казахстанская область", "Жамбылская область", "Жетысуская область",
        "Западно-Казахстанская область", "Карагандинская область", "Костанайская область",
        "Кызылординская область", "Мангистауская область", "Павлодарская область",
        "Северо-Казахстанская область", "Туркестанская область", "Улытауская область",
        "Астана", "Алматы", "Шымкент"
    ];

    for (let region of regions) {
        if (name.includes(region)) {
            return region;
        }
    }

    // Область Абай иногда записывается просто как "область Абай"
    if (name.includes("область Абай")) return "Абайская область";

    return "Неизвестный регион";
}

// Фильтр по регионам
function applyRegionFilter() {
    selectedRegion = document.getElementById("region-select").value;
    loadSchools();
}

// Сброс фильтров
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

// Добавляем обработчик для выбора региона
document.getElementById("region-select").addEventListener("change", applyRegionFilter);
