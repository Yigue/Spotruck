<?php
include 'conectarDB.php';

class Datos extends conectarDB{
    public function __construct(){
    }
    public function __destruct(){
    }
    public function obtenerProvincias()
    {
        $query = "SELECT * FROM Provincia ";
        $response = $this->ejecutarQuery($query);
        return $response;
    }
    public function obtenerLocalidades(){
        $query = "SELECT Localidad.localidad,Localidad.ID_LOCALIDAD,Provincia.provincia FROM Localidad JOIN Provincia WHERE Localidad.ID_PROVINCIA=Provincia.ID_PROVINCIAS";
        $response = $this->ejecutarQuery($query);
        return $response;
    }
    public function obtenerLocalidadID($id){
        $query = "SELECT Localidad.localidad,Localidad.ID_LOCALIDAD,Provincia.provincia FROM Localidad JOIN Provincia  WHERE Localidad.ID_PROVINCIA=Provincia.ID_PROVINCIAS and Localidad.ID_LOCALIDAD=".$id;
        $response = $this->ejecutarQuery($query);
        return $response;
    }
    public function obtenerLocalidadesProvincia($idProvincia)
    {
        $query = "SELECT localidad,ID_LOCALIDAD FROM Localidad WHERE Localidad.ID_PROVINCIA=$idProvincia";
        $response = $this->ejecutarQuery($query);
        return $response;
    }

    public function obtenerEstado()
    {
        $query = "SELECT * FROM `Estado`";
        $response = $this->ejecutarQuery($query);
        return $response;
    }

    public function obtenerTipoDeCamion()
    {
        $query = "SELECT * FROM `TipoDeCamion";
        $response = $this->ejecutarQuery($query);
        return $response;
    }

    public function obtenerTipoDeCarga()
    {
        $query = "SELECT * FROM `TipoDecarga`";
        $response = $this->ejecutarQuery($query);
        return $response;
    }

}