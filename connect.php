<html>
<body>

<?php

// Configurações do banco de dados
$dbname = 'barulhometro';
$dbuser = 'root';  
$dbpass = ''; 
$dbhost = 'localhost';  // Mantenha como localhost, já que o PHP está rodando no mesmo servidor do MySQL

// Conexão com o banco de dados
$connect = @mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);

if(!$connect){
    echo "Erro na conexão com o banco de dados: " . mysqli_connect_error();
    exit();
}

echo "Conexão com o banco de dados realizada com sucesso!<br>";

// Captura o valor enviado pelo ESP32
$disciplina = isset($_GET["disciplina"]) ? $_GET["disciplina"] : '';

// Verifica se o valor foi recebido
if(empty($disciplina)) {
    echo "Nenhum valor 'disciplina' recebido.<br>";
    exit();
}

// Insere o dado na tabela
$query = "INSERT INTO tb_advertencia (disciplina_id_advertencia) VALUES ('$disciplina')";
$result = mysqli_query($connect, $query);

if ($result) {
    echo "Dados inseridos com sucesso!<br>";
} else {
    echo "Erro ao inserir dados: " . mysqli_error($connect) . "<br>";
}

?>
</body>
</html>
