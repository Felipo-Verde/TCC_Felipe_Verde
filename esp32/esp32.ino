#include <WiFi.h>

// Configurações de WiFi
const char* ssid     = "Vírus mortal";    // Nome da rede WiFi
const char* password = "gamesedu";        // Senha da rede WiFi
const char* host = "192.168.174.3";       // IP do computador rodando o XAMPP

void setup() {
    // Inicializa o monitor serial para depuração
    Serial.begin(115200);
    WiFi.disconnect(true);  // Reseta as credenciais WiFi salvas

    delay(2000);
    Serial.println("Conectando ao WiFi...");

    // Conectar à rede WiFi
    WiFi.begin(ssid, password);

    // Aguarda até conectar ao WiFi
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    // Conexão WiFi estabelecida
    Serial.println();
    Serial.println("WiFi conectado");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
}

void loop() {
    // Definindo o valor de 'disciplina' a ser enviado ao servidor
    int disciplina = 3;  // Valor estático apenas para fins de teste

    // Conectando ao servidor
    WiFiClient client;
    const int httpPort = 80;  // Porta HTTP padrão

    Serial.print("Conectando ao servidor: ");
    Serial.println(host);

    if (!client.connect(host, httpPort)) {
        Serial.println("Falha na conexão com o servidor");
        return;
    }

    // Monta a URL da requisição GET
    String url = "/Teste_esp/connect.php?";
    url += "disciplina=" + String(disciplina);

    Serial.print("Enviando requisição: ");
    Serial.println(url);

    // Envia a requisição GET ao servidor
    client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                 "Host: " + host + "\r\n" +
                 "Connection: close\r\n\r\n");

    // Espera uma resposta do servidor
    unsigned long timeout = millis();
    while (client.available() == 0) {
        if (millis() - timeout > 5000) {
            Serial.println(">>> Timeout na resposta do servidor!");
            client.stop();
            return;
        }
    }

    // Lê a resposta do servidor e imprime no monitor serial
    while (client.available()) {
        String line = client.readStringUntil('\r');
        Serial.print(line);
    }

    Serial.println();
    Serial.println("Conexão encerrada");

    // Aguarda 10 segundos antes de enviar outra requisição
    delay(10000);
}
