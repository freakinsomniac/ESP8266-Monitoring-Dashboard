// ===================================
// KONFIGURASI MQTT - SESUAIKAN DI SINI
// ===================================
const brokerHost = "mqtt.revolusi-it.com";
const brokerPort = 9001;
const nim = "G.231.22.0155";
const topic = `iot/${nim}`;
const clientId = `${nim}-${Math.random().toString(16).substr(2, 8)}`;

// ===================================
// INISIALISASI
// ===================================
const statusSpan = document.getElementById('status');
const suhuSpan = document.getElementById('suhu');
const kelembabanSpan = document.getElementById('kelembaban');

// Buat koneksi MQTT client
const client = new Paho.MQTT.Client(brokerHost, brokerPort, clientId);

// Atur fungsi callback
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// Konfigurasi Chart.js untuk suhu
const suhuCtx = document.getElementById('suhuChart').getContext('2d');
const suhuChart = new Chart(suhuCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Suhu (°C)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: false
        }]
    },
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                }
            },
            y: {
                beginAtZero: false
            }
        }
    }
});

// Konfigurasi Chart.js untuk kelembaban
const kelembabanCtx = document.getElementById('kelembabanChart').getContext('2d');
const kelembabanChart = new Chart(kelembabanCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Kelembaban (%)',
            data: [],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            fill: false
        }]
    },
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                }
            },
            y: {
                beginAtZero: false
            }
        }
    }
});

// Koneksikan ke broker
connectToBroker();

// ===================================
// FUNGSI-FUNGSI MQTT
// ===================================
function connectToBroker() {
    statusSpan.textContent = "Connecting...";
    statusSpan.style.color = "orange";
    client.connect({
        onSuccess: onConnect,
        onFailure: onFailure,
        userName: "usm",
        password: "usmjaya1"
    });
}

function onConnect() {
    statusSpan.textContent = "Connected";
    statusSpan.style.color = "green";
    console.log("Connected to MQTT broker");
    client.subscribe(topic);
}

function onFailure(response) {
    statusSpan.textContent = `Connection Failed: ${response.errorMessage}`;
    statusSpan.style.color = "red";
    console.log(`Connection failed: ${response.errorMessage}. Retrying in 5 seconds.`);
    setTimeout(connectToBroker, 5000);
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        statusSpan.textContent = `Connection Lost: ${responseObject.errorMessage}`;
        statusSpan.style.color = "red";
        console.log(`Connection lost: ${responseObject.errorMessage}`);
        connectToBroker(); // Coba koneksi ulang
    }
}

function onMessageArrived(message) {
    console.log(`Message arrived on topic ${message.destinationName}: ${message.payloadString}`);
    try {
        const data = JSON.parse(message.payloadString);
        const suhu = parseFloat(data.suhu);
        const kelembaban = parseFloat(data.kelembaban);

        // 1. Update tampilan data
        suhuSpan.textContent = suhu.toFixed(2);
        kelembabanSpan.textContent = kelembaban.toFixed(2);

        // 2. Update grafik
        updateChart(suhu, kelembaban);

        // 3. Cek aturan untuk notifikasi BEEP
        checkBeepRules(suhu, kelembaban);

        // 4. Simpan data ke database melalui PHP
        saveDataToDB(suhu, kelembaban);

    } catch (e) {
        console.error("Error parsing message:", e);
    }
}

function publishMessage(payload) {
    if (!client.isConnected()) {
        alert("Not connected to MQTT broker!");
        return;
    }
    const message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    client.send(message);
    console.log(`Published message: ${payload}`);
}


// ===================================
// FUNGSI KONTROL LAMPU
// ===================================
function toggleLamp(pin) {
    // Ambil elemen-elemen dari HTML
    const button = document.getElementById(`switch-${pin}`);

    // Cek status saat ini dari switch
    const currentState = button.getAttribute('aria-pressed') === 'true';
    const newState = !currentState;

    // Update state dan UI
    button.setAttribute('aria-pressed', newState);
    updateSwitchUI(pin, newState); // Panggil fungsi update UI

    // Tentukan pesan MQTT yang benar (String, bukan JSON)
    let ledNumber;
    if (pin === 'd6') ledNumber = 1;
    if (pin === 'd7') ledNumber = 2;
    if (pin === 'd8') ledNumber = 3;

    const payload = `LED${ledNumber}_${newState ? 'ON' : 'OFF'}`;

    // Kirim pesan MQTT
    publishMessage(payload);
}

function updateSwitchUI(pin, isOn) {
    const btn = document.getElementById(`switch-${pin}`);
    const knob = document.getElementById(`knob-${pin}`);
    const label = document.getElementById(`label-${pin}`);
    if (isOn) {
        btn.classList.remove('bg-gray-300');
        btn.classList.add('bg-blue-600'); // Warna saat ON
        knob.style.transform = 'translateX(1.5rem)';
        label.textContent = 'ON';
    } else {
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-300'); // Warna saat OFF
        knob.style.transform = 'translateX(0)';
        label.textContent = 'OFF';
    }
}


// ===================================
// FUNGSI BANTUAN LAINNYA
// ===================================
function updateChart(suhu, kelembaban) {
    const now = new Date();

    // Update suhu chart
    suhuChart.data.labels.push(now);
    suhuChart.data.datasets[0].data.push(suhu);
    if (suhuChart.data.labels.length > 30) {
        suhuChart.data.labels.shift();
        suhuChart.data.datasets[0].data.shift();
    }
    suhuChart.update();

    // Update kelembaban chart
    kelembabanChart.data.labels.push(now);
    kelembabanChart.data.datasets[0].data.push(kelembaban);
    if (kelembabanChart.data.labels.length > 30) {
        kelembabanChart.data.labels.shift();
        kelembabanChart.data.datasets[0].data.shift();
    }
    kelembabanChart.update();
}

function checkBeepRules(suhu, kelembaban) {
    // Aturan Suhu
    if (suhu > 31) {
        playSound(3); // Beep 3x
    } else if (suhu >= 30 && suhu <= 31) {
        playSound(2); // Beep 2x
    } else if (suhu > 29 && suhu < 30) {
        playSound(1); // Beep 1x
    }

    // Aturan Kelembaban
    if (kelembaban >= 70) {
        playSound(3); // Beep 3x
    } else if (kelembaban >= 60 && kelembaban < 70) {
        playSound(1); // Beep 1x
    }
}

function playSound(times) {
    const audioContext = new(window.AudioContext || window.webkitAudioContext)();
    let count = 0;
    const play = () => {
        if (count >= times) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        count++;
        setTimeout(play, 300);
    };
    play();
}

function saveDataToDB(suhu, kelembaban) {
    const formData = new FormData();
    formData.append('suhu', suhu);
    formData.append('kelembaban', kelembaban);

    fetch('save_data.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => console.log('Save to DB response:', data))
        .catch(error => console.error('Error saving data:', error));
}