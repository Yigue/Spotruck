<?php
session_start();
header('Content-Type:application/json');


if(isset($_GET['modo'])){
    include '../Model/Model_Datos.php';
    $json = array("error" => "Modo no valido", "errno" => "2");
    $datos = new Datos();
    switch($_GET['modo']){
        case "obtenerProvincias":
            $json="";
            $response = $datos->obtenerProvincias();
            while ($row = mysqli_fetch_array($response)) {
                $json[] = array(
                    "ID_PROVINCIAS" => $row['ID_PROVINCIAS'],
                    "provincia" => $row['provincia'],
                );
            }
            break;
        case "obtenerLocalidades":
                     $json ="";
                    $response=$datos->obtenerLocalidades();
                    while ($row = mysqli_fetch_array($response)){
                            $json[]=array(
                            "ID_LOCALIDAD"=>$row['ID_LOCALIDAD'],
                            "localidad"=>$row['localidad'],
                            "provincia"=>$row['provincia'],
                        );
                    }
            break;
        case "saberLocalidad":{
                $json = "";
                if(isset($_GET['idLocalidad'])){ 
                        $response = $datos->obtenerLocalidadID($_GET['idLocalidad']);
                        while ($row = mysqli_fetch_array($response)) {
                            $json= $row['localidad'].",".$row['provincia'].",Argentina";
                        
                        }
                }else{
                    $json = array("error" => "id No obtenida", "errno" => "");
                }
        }
        break;
        case "obtenerLocalidadesProvincia":
            $json = "";
            $response = $datos->obtenerLocalidadesProvincia($_GET['idProvincia']);
            while ($row = mysqli_fetch_array($response)) {
                $json[] = array(
                    "ID_LOCALIDAD" => $row['ID_LOCALIDAD'],
                    "localidad" => $row['localidad'],
                );
            }
            break;
        case "obtenerEstado":
                    $json="";
                    $response = $datos->obtenerEstado();
                    while ($row = mysqli_fetch_array($response)) {
                        $json[] = array(
                        "ID_ESTADO" => $row['ID_ESTADO'],
                        "estado" => $row['estado'],
                        );
                    }
            break;
        case "obtenerTipoDeCamion":
                    $json="";
                    $response = $datos->obtenerTipoDeCamion();
                    while ($row = mysqli_fetch_array($response)) {
                        $json[]= array(
                            "ID_TIPODECAMION" => $row['ID_TIPODECAMION'],
                            "tipoDeCamion" => $row['tipoDeCamion'],
                        );
                    }
            break;
        case "obtenerTipoDeCarga":
                    $json = "";
                    $response = $datos->obtenerTipoDeCarga();
                    while ($row = mysqli_fetch_array($response)) {
                        $json[] = array(
                            "ID_TIPODECARGA" => $row['ID_TIPODECARGA'],
                            "tipoDeCarga" => $row['tipoDeCarga'],
                        );
                    }
            break;
    }
}else{
    $json = array("error" => "No se seleciono modo de publicaciones", "errno" => "1");
}



echo json_encode($json);


?>