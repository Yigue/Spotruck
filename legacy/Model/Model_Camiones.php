<?php
include 'conectarDB.php';
// include_once '../Model/Model_Inicio.php';

class Camion extends conectarDB
{
    public function __construct()
    {
    }
    public function __destruct()
    {
    }
// 
    public function cargarCamion(&$datos){
        $query = "INSERT INTO `Camion` (`ID_CAMION`, `ID_TRASPORTISTA`, `ID_TIPOCAMION`, `capacidad`, `ruta`, `patente`, `seguro`) VALUES (NULL, '" . $datos->idTrasportista . "', '" . $datos->tipoCamion . "', '" . $datos->capacidad . "', '" . $datos->ruta . "', '" . $datos->patente . "', NULL);";
        $response = $this->ejecutarQuery($query);
        return $response;
    }
// 
    public function modificarCamion(&$datos){
        $query = "UPDATE `Camion` SET `ID_TIPOCAMION` = '" . $datos->tipoCamion . "', `capacidad` = '" . $datos->capacidad . "', `ruta` = '" . $datos->ruta . "', `patente` = '" . $datos->patente . "' WHERE `Camion`.`ID_CAMION` = '" . $datos->idCamion . "';";
        $response = $this->ejecutarQuery($query);
        return $response;
    }
// 
    public function borrarCamion($idCamion){
        $query = "DELETE FROM `Camion` WHERE `ID_CAMION`=$idCamion" ;
        $response = $this->ejecutarQuery($query);
        return $response;
    }
// 
    public function verMisCamiones($idTrasportista){
        $query = "SELECT Camion.ID_CAMION,Camion.ID_TRASPORTISTA,Camion.capacidad,Camion.ruta,Camion.patente,TipoDeCamion.tipoDeCamion FROM `Camion` INNER JOIN TipoDeCamion WHERE Camion.ID_TIPOCAMION=TipoDeCamion.ID_TIPODECAMION  AND Camion.ID_TRASPORTISTA=$idTrasportista";
        $response = $this->ejecutarQuery($query);
        return $response;
    }

}
