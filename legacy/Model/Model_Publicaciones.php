<?php
include 'conectarDB.php';

class Publicaciones extends conectarDB{
    public function __construct()
        {
                    //
        }
    public function __destruct()
    {
                    //
    }
    
    public function obtenerPublicaciones(){
        $query = "SELECT Usuario.ID_USUARIO,Empresa.ID_EMPRESA, Publicacion.ID_PUBLICACION,Publicacion.fechaInicio,Publicacion.fechaFin,Publicacion.localidadOrigen,Publicacion.localidadDestino,Publicacion.detalle, Publicacion.peso,Publicacion.volumen, Publicacion.fechaCreacion,Estado.estado,TipoDecarga.tipoDeCarga,Subasta.ID_SUBASTA,Subasta.estadoSubasta FROM Usuario JOIN Estado JOIN Publicacion JOIN TipoDecarga JOIN Empresa JOIN Subasta WHERE Usuario.ID_USUARIO = Empresa.ID_USUARIO AND Publicacion.ID_EMPRESA = Empresa.ID_EMPRESA AND Publicacion.ID_ESTADO = Estado.ID_ESTADO AND TipoDecarga.ID_TIPODECARGA = Publicacion.ID_TIPODEPRODUCTO AND Subasta.ID_PUBLICACIONES=Publicacion.ID_PUBLICACION";
        $response = $this->ejecutarQuery($query);
        return $response;
        
    }
    public function obtenerMisPublicaciones($idEmpresa){
        $query = "SELECT Usuario.ID_USUARIO,Empresa.ID_EMPRESA, Publicacion.ID_PUBLICACION,Publicacion.fechaInicio,Publicacion.fechaFin,Publicacion.localidadOrigen,Publicacion.localidadDestino,Publicacion.detalle, Publicacion.peso,Publicacion.volumen, Publicacion.fechaCreacion,Estado.estado,TipoDecarga.tipoDeCarga FROM Usuario JOIN Estado JOIN Publicacion JOIN TipoDecarga JOIN Empresa WHERE Usuario.ID_USUARIO = Empresa.ID_USUARIO AND Publicacion.ID_EMPRESA = Empresa.ID_EMPRESA AND Publicacion.ID_ESTADO = Estado.ID_ESTADO AND TipoDecarga.ID_TIPODECARGA = Publicacion.ID_TIPODEPRODUCTO AND Publicacion.ID_EMPRESA =".$idEmpresa;
        $response = $this->ejecutarQuery($query);
        return $response;
    }
    public function obtenerDataPubli($idPubli){
        $query = "SELECT Usuario.ID_USUARIO,Empresa.ID_EMPRESA, Publicacion.ID_PUBLICACION,Publicacion.fechaInicio,Publicacion.fechaFin,Publicacion.localidadOrigen,Publicacion.localidadDestino,Publicacion.detalle, Publicacion.peso,Publicacion.volumen, Publicacion.fechaCreacion,Estado.estado,TipoDecarga.tipoDeCarga FROM Usuario JOIN Estado JOIN Publicacion JOIN TipoDecarga JOIN Empresa WHERE Usuario.ID_USUARIO = Empresa.ID_USUARIO AND Publicacion.ID_EMPRESA = Empresa.ID_EMPRESA AND Publicacion.ID_ESTADO = Estado.ID_ESTADO AND TipoDecarga.ID_TIPODECARGA = Publicacion.ID_TIPODEPRODUCTO AND Publicacion.ID_PUBLICACION=" . $idPubli;
        $response = $this->ejecutarQuery($query);
        return $response;
    }
    public function hacerPublicacion(&$datos){
        $query = "INSERT INTO `Publicacion`  (`ID_PUBLICACION`, `ID_EMPRESA`, `ID_TIPODEPRODUCTO`, `localidadOrigen`, `localidadDestino`, `ID_ESTADO`, `fechaInicio`, `fechaFin`, `ubicacion`, `detalle`, `peso`, `volumen`, `fechaCreacion`)  VALUES (NULL, '" . $datos->idEmpresa . "', '" . $datos->idTipoProducto . "', '" . $datos->localidadOrigen . "','" . $datos->localidadDestino . "','2', '" . $datos->fechaInicio . "', '" . $datos->fechaFin . "',null,'" . $datos->detalle . "', '" . $datos->peso . "', '" . $datos->volumen . "', CURRENT_TIMESTAMP );";
        $response = $this->ejecutarQuery($query);
        $response=$this->ejecutarQuery('SELECT MAX(Publicacion.ID_PUBLICACION) as id FROM Publicacion');
        $res = mysqli_fetch_array($response);
        $id=$res['id'];
        $response=$this->crearSubasta($id);
        return $response;
    }
    public function  crearSubasta($idPublicacion){
                    $query = "INSERT INTO `Subasta` (`ID_SUBASTA`, `ID_PUBLICACIONES`, `estadoSubasta`, `fechaCreacion`) VALUES (NULL, '" . $idPublicacion . "', '0',CURRENT_TIMESTAMP)";
                    $this->ejecutarQuery($query);
                    $this->error = "Subasta de Publicacion creada";
                    $this->errno = 300;
                    return $this;
            }
    public function updatePublicaciones(&$datos){
                $query = "UPDATE `Publicacion` SET `ID_LOCALIDAD` = '" . $datos->idLocalidad . "', `fechaInicio` = '" . $datos->fechaInicio . "', `fechaFin` = '" . $datos->fechaFin . "', `ubicacion` = '" . $datos->ubicacion . "', `detalle` = '" . $datos->detalle . "', `peso` = '" . $datos->peso . "', `volumen` = '" . $datos->volumen . "', `ID_ESTADO` = '" . $datos->idestado . "' , `ID_TIPODEPRODUCTO` = '" . $datos->idtipoProducto . "' WHERE `Publicacion`.`ID_PUBLICACION` = " . $datos->idUsuario . "";
                $this->ejecutarQuery($query);
                return $query;
            }

    public function deletePublicaciones($idPublicacion){
        $query = "DELETE FROM `Publicacion` WHERE `Publicacion`.`ID_PUBLICACION` =$idPublicacion";
        $this->ejecutarQuery($query);
        return $query;
    }
    

    
}

?> 
