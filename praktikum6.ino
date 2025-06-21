/*
 * TUGAS AKHIR PRAKTIKUM 6 IOT
 * Sistem Kendali LED dan Monitoring Suhu/Kelembaban
 * Nama Mahasiswa: Andreas Damar Saputra
 * NIM: G.231.22.0155
 */

// 1. Panggil semua library yang dibutuhkan
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <ArduinoJson.h>

// 2. Konfigurasi WiFi
const char* ssid = "kere ya?";
const char* password = "andrebaikhati";

// 3. Konfigurasi MQTT Server dan Topik
const char* mqtt_server = "mqtt.revolusi-it.com";
const char* mqtt_user = "usm";
const char* mqtt_pass = "usmjaya1";
const char* nim = "G.231.22.0155";

// Menggabungkan string untuk topik MQTT
char mqtt_topic[50];

// Client ID untuk perangkat NodeMCU menggunakan NIM
const char* mqtt_client_id_nodemcu = nim;

// 4. Konfigurasi Pin Hardware
#define DHTPIN D4
#define DHTTYPE DHT11

// Pin untuk LED
#define LED1_PIN D6
#define LED2_PIN D7
#define LED3_PIN D8

// 5. Inisialisasi Objek
WiFiClient espClient;
PubSubClient client(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHTPIN, DHTTYPE);

// 6. Variabel Global untuk Timer
long lastMsg = 0;
int interval = 5000;

// ======================= FUNGSI SETUP =======================
void setup() {
  Serial.begin(115200);

  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Praktikum 6 IOT");
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");

  dht.begin();
  sprintf(mqtt_topic, "iot/%s", nim);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// ======================= FUNGSI KONEKSI WIFI =======================
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// ======================= FUNGSI CALLBACK MQTT =======================
// Fungsi ini akan mengontrol LED berdasarkan pesan dari web/MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  if (message == "LED1_ON") {
    digitalWrite(LED1_PIN, HIGH);
  } else if (message == "LED1_OFF") {
    digitalWrite(LED1_PIN, LOW);
  } else if (message == "LED2_ON") {
    digitalWrite(LED2_PIN, HIGH);
  } else if (message == "LED2_OFF") {
    digitalWrite(LED2_PIN, LOW);
  } else if (message == "LED3_ON") {
    digitalWrite(LED3_PIN, HIGH);
  } else if (message == "LED3_OFF") {
    digitalWrite(LED3_PIN, LOW);
  }
}

// ======================= FUNGSI REKONEKSI MQTT =======================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id_nodemcu, mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ======================= FUNGSI LOOP UTAMA =======================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Sensor Error");
      return;
    }

    // Kontrol LED berdasarkan suhu
    controlLEDsByTemperature(t);

    // Alokasi memori JSON yang dinamis dan aman
    const int capacity = JSON_OBJECT_SIZE(2);
    StaticJsonDocument<capacity> doc;

    doc["suhu"] = t;
    doc["kelembaban"] = h;

    char jsonBuffer[128];
    serializeJson(doc, jsonBuffer);

    client.publish(mqtt_topic, jsonBuffer);
    Serial.print("Publish message: ");
    Serial.println(jsonBuffer);

    String statusLembab;
    if (h >= 70) {
      statusLembab = "Banyak Uap Air";
    } else if (h >= 60) {
      statusLembab = "Normal";
    } else if (h >= 30) {
      statusLembab = "Aman";
    } else {
      statusLembab = "Sangat Kering";
    }

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("S:");
    lcd.print(t, 1);
    lcd.print("C ");
    lcd.setCursor(8, 0);
    lcd.print("L:");
    lcd.print(h, 1);
    lcd.print("%");
    lcd.setCursor(0, 1);
    lcd.print(statusLembab);
  }
}

// ======================= FUNGSI KONTROL LED BERDASARKAN SUHU =======================
void controlLEDsByTemperature(float temperature) {
  // Logika kontrol LED berdasarkan suhu
  if (temperature >= 31) {
    // Suhu >= 31: Semua LED menyala
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, HIGH);
    digitalWrite(LED3_PIN, HIGH);
    Serial.println("Suhu >= 31°C: Semua LED menyala");
  } 
  else if (temperature >= 30) {
    // Suhu >= 30: LED 1 dan 2 menyala, LED 3 mati
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, HIGH);
    digitalWrite(LED3_PIN, LOW);
    Serial.println("Suhu >= 30°C: LED 1 & 2 menyala");
  } 
  else if (temperature >= 29) {
    // Suhu >= 29: LED 1 menyala, LED 2 dan 3 mati
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, LOW);
    digitalWrite(LED3_PIN, LOW);
    Serial.println("Suhu >= 29°C: LED 1 menyala");
  } 
  else {
    // Suhu < 29: Semua LED mati
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, LOW);
    digitalWrite(LED3_PIN, LOW);
    Serial.println("Suhu < 29°C: Semua LED mati");
  }
}