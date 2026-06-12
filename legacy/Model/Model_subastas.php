 <?php
        include 'conectarDB.php';

        class subasta extends conectarDB
        {
            public function __construct(){
      
            }
            public function __destruct()
            {
        
            }
        public function verificarSubasta($idPublicacion){
            $query = "SELECT * FROM `Subasta` WHERE `ID_PUBLICACIONES` =" . $idPublicacion;
            $response = $this->ejecutarQuery($query);
            if ($response->num_rows == 0) {
                $this->error = "Subasta de Publicacion No existe";
                $this->errno = 301;
            } else {
                $this->error = "Subasta de Publicacion ya existente";
                $this->errno = 310;
            }
            return $this;
        }
        public function verificarEstadoSubasta($idSubasta){
            $query = "SELECT `estadoSubasta` FROM `Subasta` WHERE `ID_SUBASTA`=$idSubasta" ;
            $response = $this->ejecutarQuery($query);
            $res = mysqli_fetch_array($response);
            if ($res['estadoSubasta']==0) {
                $this->error = "Subasta Sigue Abierta";
                $this->errno = 200;
            }else {
                $this->error = "Subasta Ya Cerrada";
                $this->errno = 404;
            }
            return $this;
        }
        
        public function cerrarSubasta($idPublicacion){
                $query = "UPDATE `Subasta` SET `estadoSubasta` = '1' WHERE `Subasta`.`ID_PUBLICACIONES` =" . $idPublicacion;
                $this->ejecutarQuery($query);
                $this->error = "Subasta cerrada";
                $this->errno = 320;
             
                return $this;
            }
        public  function borrarSubasta($idPublicacion){
                $query = "DELETE FROM `Subasta` WHERE `Subasta`.`ID_PUBLICACIONES` =" . $idPublicacion;
                $this->ejecutarQuery($query);
                $this->error = "Subasta Borrada";
                $this->errno = 315;
                return $this;
            }
        public function conseguirDataSubasta($idPublicacion){
                    $query = "SELECT * FROM `Subasta` WHERE `ID_PUBLICACIONES` =" . $idPublicacion;
                    $response = $this->ejecutarQuery($query);


                        if ($response->num_rows == 1) {
                                $fila = $response->fetch_array(MYSQLI_ASSOC);

                                $this->ID_SUBASTA = $fila["ID_SUBASTA"];
                                $this->ID_PUBLICACIONES = $fila["ID_PUBLICACIONES"];
                                $this->estadoSubasta = $fila["estadoSubasta"];
                                $this->fechaCreacion = $fila["fechaCreacion"];

                                return $this;
                    }else{
                        $this->error="No existe la subasta";
                    }
           }
        public function mostrarSubastas(){
            $query = "SELECT * FROM `Subasta` " ;
            $response = $this->ejecutarQuery($query);
            return $response;
        }

        public  function mostrarOfertas($idPublicacion){
            $query = "SELECT Oferta.*,Subasta.estadoSubasta,Subasta.fechaCreacion as fechaSubasta,TipoDeCamion.tipoDeCamion,Camion.capacidad,Camion.ruta,Camion.patente,Usuario.nombre,Usuario.puntaje,Usuario.cuit,Trasportista.viajesRealizados FROM Subasta JOIN Oferta JOIN Trasportista JOIN Usuario JOIN Camion JOIN TipoDeCamion WHERE Oferta.ID_SUBASTA=Subasta.ID_SUBASTA AND Oferta.ID_CAMION=Camion.ID_CAMION AND Camion.ID_TRASPORTISTA =Trasportista.ID_TRANSPORTISTA AND TipoDeCamion.ID_TIPODECAMION=Camion.ID_TIPOCAMION AND Usuario.ID_USUARIO=Trasportista.ID_USUARIO AND Subasta.ID_PUBLICACIONES =$idPublicacion";
            $response = $this->ejecutarQuery($query);
            if ($response->num_rows>0) {
                return $response;
                
            }else{
                $this->error = "No Hay Ofertas Aun";
                $this->error = "404";
                return $this;
            }
         
        }

        
        
// OFERTAS
        public function hacerOferta(&$datosOferta){
                $query = "INSERT INTO `Oferta` (`ID_OFERTA`, `ID_SUBASTA`, `ID_CAMION`, `estado`, `precio`, `aclaracion`,`fechaCreacion`) VALUES (NULL, '" . $datosOferta->ID_SUBASTA . "', '" . $datosOferta->ID_CAMION . "',0, '" . $datosOferta->precio . "', '" . $datosOferta->aclaracion . "',CURRENT_TIMESTAMP)";
                $this->ejecutarQuery($query);
                $response = $this->ejecutarQuery('SELECT MAX(`ID_OFERTA`) as id FROM Oferta');
                $res = mysqli_fetch_array($response);
                $id = $res['id'];
                $this->idOferta=$id;
                $this->error = "Se ha Registrado la Oferta";
                $this->errno= 200;
                return $this;
               
        }

        public  function borrarOferta($idOferta){
            $query = "DELETE FROM `Oferta` WHERE `Oferta`.`ID_OFERTA` = " . $idOferta . "";
            $this->ejecutarQuery($query);
            $this->error = "Se ha Borrado la Oferta";
            $this->errno = 200;
            return $this;
        }

        public function modificarOferta(&$datosOferta){
            $query = "UPDATE `Oferta` SET  `ID_CAMION` = '" . $datosOferta->ID_CAMION . "',`ID_ESTADO` = '" . $datosOferta->ID_ESTADO . "', `precio` = '" . $datosOferta->precio . "', `aclaracion` = '" . $datosOferta->aclaracion . "',`fechaCreacion`=CURRENT_TIMESTAMP WHERE `Oferta`.`ID_OFERTA` = " . $datosOferta->ID_OFERTA . ";";
            $this->ejecutarQuery($query);
            $this->error = "Se ha Modificado correctamente la Oferta";
            $this->errno = 200;
            return $this;
        }
        public  function bajarOferta($idOferta){
            $query = "UPDATE `Oferta` SET `estado` = '1' WHERE `Oferta`.`ID_OFERTA` = $idOferta ;";
            $this->ejecutarQuery($query);
            $this->error = "Se rechazo la Oferta ";
            $this->errno = 200;
            return $this;
        }
        public  function aceptarOferta($idOferta,$idSubasta,$idPubli){
            $query = "UPDATE `Oferta` SET `estado` = '1' WHERE ID_SUBASTA=$idSubasta AND Oferta.ID_OFERTA<>$idOferta";
            $this->ejecutarQuery($query);
            $this->cerrarSubasta($idPubli);
            $this->estadoProceso($idPubli);
            $this->crearViaje($idPubli,$idOferta);
            $this->error = "Subasta Cerrada";
            $this->errno = 200;
            return $query;
        }
        public function estadoProceso($idPubli){
            $query = "UPDATE `Publicacion` SET `ID_ESTADO` = '4' WHERE `Publicacion`.`ID_PUBLICACION` = $idPubli;";
            $this->ejecutarQuery($query);
            return true;
        }
        public function crearViaje($idPubli,$idOferta){
            $query = "INSERT INTO `Viaje` (`ID_VIAJE`, `ID_PUBLICACION`, `ID_OFERTA`, `ID_SEGURO`, `estado`) VALUES (NULL, '".$idPubli."', '$idOferta', NULL, '4');";
            $this->ejecutarQuery($query);
            return true;
        }

   
        public  function verMisPostulaciones($idTrasportista){
            $query = "SELECT Oferta.ID_OFERTA,Oferta.ID_SUBASTA,Oferta.estado,Oferta.precio,Oferta.aclaracion,Oferta.fechaCreacion as fechaCreacionOferta, Subasta.ID_PUBLICACIONES,Camion.ID_CAMION,Camion.capacidad,Camion.patente,Camion.ruta,TipoDeCamion.tipoDeCamion FROM Oferta JOIN Camion JOIN Trasportista JOIN Subasta JOIN TipoDeCamion ON Oferta.ID_CAMION=Camion.ID_CAMION AND Trasportista.ID_TRANSPORTISTA=Camion.ID_TRASPORTISTA AND Subasta.ID_SUBASTA=Oferta.ID_SUBASTA AND TipoDeCamion.ID_TIPODECAMION=Camion.ID_TIPOCAMION AND Trasportista.ID_TRANSPORTISTA=". $idTrasportista;
            $response = $this->ejecutarQuery($query);
            return $response;
        }


        public  function verificarOferta(&$datosOferta){
            $query = "SELECT * FROM `Oferta` WHERE `ID_CAMION`=" . $datosOferta->ID_CAMION . " AND `ID_SUBASTA`=" . $datosOferta->ID_SUBASTA . "";
            $response = $this->ejecutarQuery($query);
            if ($response->num_rows == 1) {
                $fila = $response->fetch_array(MYSQLI_ASSOC);
                $this->ID_OFERTA = $fila["ID_OFERTA"];
                $this->ID_SUBASTA = $fila["ID_SUBASTA"];
                $this->ID_CAMION = $fila["ID_CAMION"];
                $this->ID_ESTADO = $fila["ID_ESTADO"];
                $this->precio = $fila["precio"];
                $this->aclaracion = $fila["aclaracion"];
                $this->error = "Oferta Encontrada";
                $this->errno = 1101;
            } else {
                $this->error = "No existe la oferta";
                $this->errno = 1102;
            }
            return $this;
        }



        }
       

?> 