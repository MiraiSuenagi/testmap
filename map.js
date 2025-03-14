document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([48.0196, 66.9237], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markers = L.layerGroup();
    var schoolData = [];
    var selectedRegion = "all";

    let yearSlider = document.getElementById('timeline-slider');
    let monthSlider = document.getElementById('month-slider');
    let totalSchoolsEl = document.getElementById("total-schools");
    let filteredSchoolsEl = document.getElementById("filtered-schools");
    let schoolListEl = document.getElementById("school-list");
    let playing = true;

    // Проверяем существование элементов
    if (!yearSlider || !monthSlider || !totalSchoolsEl || !filteredSchoolsEl || !schoolListEl) {
        console.error("Один или несколько элементов UI не найдены в HTML!");
        return;
    }

    function updateSchoolInfo(filteredData) {
        totalSchoolsEl.textContent = schoolData.length;
        filteredSchoolsEl.textContent = filteredData.length;
        schoolListEl.innerHTML = "";

        if (filteredData.length === 0) {
            schoolListEl.innerHTML = "<p>Нет школ в этом регионе.</p>";
        } else {
            filteredData.forEach(school => {
                let schoolItem = document.createElement("div");
                schoolItem.textContent = school.properties.name;
                schoolListEl.appendChild(schoolItem);
            });
        }
    }

    function loadSchools() {
        let year = parseInt(yearSlider.value);
        let month = parseInt(monthSlider.value);
        markers.clearLayers();

        let filteredData = schoolData.filter(school => {
            if (!school.properties.completed) return false;

            let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));

            let isCompleted = completedDate.getFullYear() < year || 
                (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month);

            if (!isCompleted) return false;

            if (selectedRegion !== "all" && school.properties.region !== selectedRegion) {
                return false;
            }

            return true;
        });

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

    function applyRegionFilter() {
        selectedRegion = document.getElementById("region-select").value;
        loadSchools();
    }

    function resetFilters() {
        selectedRegion = "all";
        loadSchools();
    }

    fetch('schools.json')
        .then(response => response.json())
        .then(data => {
            schoolData = data;
            console.log("Данные школ загружены:", schoolData);

            // Проверяем перед установкой значений
            if (totalSchoolsEl) {
                totalSchoolsEl.textContent = schoolData.length;
            }

            loadSchools();
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));

    yearSlider.addEventListener('input', loadSchools);
    monthSlider.addEventListener('input', loadSchools);
    document.getElementById("region-select").addEventListener("change", applyRegionFilter);
});
