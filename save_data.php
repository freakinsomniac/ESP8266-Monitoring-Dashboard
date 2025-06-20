<?php
// Aktifkan pelaporan error untuk debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ========================================================
// KONFIGURASI DATABASE - PASTIKAN SAMA PERSIS SEPERTI DI ATAS
// ========================================================
$dbHost = "localhost";
$dbUser = "iot_user";                   // <-- Pastikan namanya 'iot_user'
$dbPass = "iot";         // <-- Gunakan password yang baru saja Anda buat
$dbName = "iot-praktikum";

// Buat Koneksi
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

// Cek koneksi
if ($conn->connect_error) {
    header("HTTP/1.1 500 Internal Server Error");
    die("Koneksi Database Gagal: " . $conn->connect_error);
}

// ... (sisa kode Anda biarkan sama) ...

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    die("Metode request tidak valid.");
}

if (!isset($_POST['suhu']) || !isset($_POST['kelembaban'])) {
    header("HTTP/1.1 400 Bad Request");
    die("Data suhu atau kelembaban tidak diterima.");
}

$sql = "INSERT INTO log_sensor (suhu, kelembaban) VALUES (?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    die("Gagal mempersiapkan statement: " . $conn->error);
}

$suhu = $_POST['suhu'];
$kelembaban = $_POST['kelembaban'];
$stmt->bind_param("dd", $suhu, $kelembaban);

$stmt->execute();

$affected_rows = $stmt->affected_rows;

if ($affected_rows > 0) {
    echo "Success: 1 baris data berhasil dimasukkan ke database.";
} else {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Failure: Perintah INSERT dieksekusi TAPI tidak ada baris yang ditambahkan. Laporan Error: " . $stmt->error;
}

$stmt->close();
$conn->close();

?>