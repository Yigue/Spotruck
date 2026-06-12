<?php 

	abstract class conectarDB
	{

		private static $host = "localhost";
		private static $user = "11760";
		private static $pass = "11760";
		private static $db = "11760";

		private $conn;

		// Metodo para la conexión con la base de datos /VA SELF:: PQ SON VARIABLES ESTATICAS
		function conectarDB(){

			$this->conn = new mysqli(self::$host, self::$user, self::$pass, self::$db);
	
		}

		// Metodo para ejecutar una consulta a la base de datos
		function ejecutarQuery($query, $debug = false){

			// conecta con la base de datos
			$this->conectarDB();

			// ejecuta la consulta
			$result =  $this->conn->query($query);
			
			
		

			// si necesitamos depurar se muestran los errores
			if($debug){
		
				echo $this->conn->error."<br>";
				echo $this->conn->errno."<br>";	
			}
		
			// cierra la conexion con la base de datos
			$this->conn->close();
		
			// retorna el resultado
			return $result;
		}

	}
