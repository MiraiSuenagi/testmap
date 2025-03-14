document.addEventListener("DOMContentLoaded", function () {
    // Инициализация карты
    var map = L.map('map').setView([48.0196, 66.9237], 5);

    // Добавление слоя карты (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markers = L.layerGroup();
    var schoolData = [];
    var selectedRegion = "all"; // Выбранный регион

    // Получаем ссылки на элементы
    let yearSlider = document.getElementById('timeline-slider');
    let monthSlider = document.getElementById('month-slider');
    let currentYear = parseInt(yearSlider.value);
    let maxYear = parseInt(yearSlider.max);
    let currentMonth = parseInt(monthSlider.value);
    let playing = true;

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

    function downloadExcel() {
        let year = parseInt(yearSlider.value);
        let month = parseInt(monthSlider.value);

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

        if (filteredData.length === 0) {
            alert("Нет данных для скачивания!");
            return;
        }

        let excelData = filteredData.map(school => ({
            "Название школы": school.properties.name,
            "Регион": school.properties.region,
            "Год завершения": school.properties.completed,
            "Координаты": `${school.geometry.coordinates[1]}, ${school.geometry.coordinates[0]}`
        }));

        let worksheet = XLSX.utils.json_to_sheet(excelData);
        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Школы");

        XLSX.writeFile(workbook, "Список_школ.xlsx");
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
            document.getElementById("total-schools").textContent = schoolData.length;
            loadSchools();
            autoPlaySlider();
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));

    yearSlider.addEventListener('input', () => {
        currentYear = parseInt(yearSlider.value);
        loadSchools();
    });

    monthSlider.addEventListener('input', () => {
        currentMonth = parseInt(monthSlider.value);
        loadSchools();
    });

    document.getElementById("toggleAnimation").addEventListener("click", function () {
        playing = !playing;
        this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
    });

    document.getElementById("region-select").addEventListener("change", applyRegionFilter);
    document.getElementById("downloadExcel").addEventListener("click", downloadExcel);
});
