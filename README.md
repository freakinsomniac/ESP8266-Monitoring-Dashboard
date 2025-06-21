# 🌡️ IoT Monitoring Dashboard

## 📋 Fitur Utama

- 🔄 Koneksi MQTT real-time
- 📊 Visualisasi grafik suhu dan kelembaban
- 🔔 Alert suara otomatis saat parameter melewati ambang batas
- 💾 Penyimpanan data ke database MySQL
- 💡 Kontrol lampu LED via MQTT
- 🎨 UI modern dengan tema Netflix

## 🛠️ Teknologi

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: PHP
- **Database**: MySQL
- **Data Visualization**: Chart.js
- **Communication**: MQTT via Paho MQTT

## 🚀 Cara Penggunaan

### Prasyarat
- Web server (Apache/Nginx)
- PHP 7.4+
- MySQL
- Koneksi internet untuk CDN

### Instalasi

1. Clone repositori ini
```bash
git clone https://github.com/freakinsomniac/iot-monitoring-dashboard.git
```

2. Import skema database
```sql
CREATE DATABASE iot_praktikum;
USE iot_praktikum;

CREATE TABLE log_sensor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  suhu FLOAT NOT NULL,
  kelembaban FLOAT NOT NULL,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE USER 'iot_user'@'localhost' IDENTIFIED BY 'iot';
GRANT ALL PRIVILEGES ON iot_praktikum.* TO 'iot_user'@'localhost';
FLUSH PRIVILEGES;
```

3. Konfigurasi database di `save_data.php`

4. Buka aplikasi di web browser

## 🔄 MQTT Setup

Aplikasi menggunakan broker MQTT `mqtt.revolusi-it.com` dengan protokol WebSocket pada port 9001. Konfigurasi dapat disesuaikan di `app.js`.

Payload yang dikirim dari sensor harus dalam format JSON:
```json
{ "suhu": 28.5, "kelembaban": 65.2 }
```

## 👤 Owner

- **Nama:** Andreas Damar Saputra
- **NIM:** G.231.22.0155
- **Institusi:** Universitas Semarang