<?php

session_start();


header('Content-Type:application/json');

   
if(isset($_GET['modo'])){
   
    include_once '../Model/Model_Viaje.php';

    $test = new Viaje();

    switch($_GET['modo']){
        case "test":

        break;
        case "obtenerViaje":
            if (!empty($_SESSION['idpubli'])) { 
            $response=$test->obtenerViaje(6);
            while ($row = mysqli_fetch_array($response)) {
                $json[] = array(
                    "ID_USUARIO" => $row['ID_USUARIO'],
                    "email" => $row['email'],
                    "cuit" => $row['cuit'],
                    "nombre" => $row['nombre'],
                    "puntaje" => $row['puntaje'],
                    "ID_EMPRESA" => $row['ID_EMPRESA'],
                    "ID_PUBLICACION" => $row['ID_PUBLICACION'],
                    "fechaInicio" => $row['fechaInicio'],
                    "fechaFin" => $row['fechaFin'],
                    "localidadOrigen" => $row['localidadOrigen'],
                    "localidadDestino" => $row['localidadDestino'],
                    "detalle" => $row['detalle'],
                    "peso" => $row['peso'],
                    "volumen" => $row['volumen'],
                    "estado" => $row['estado'],
                    "tipoDeCarga" => $row['tipoDeCarga'],
                    "fechaCreacion" => $row['fechaCreacion'],
                    "tipoDeCarga" => $row['tipoDeCarga'],
                    "ID_VIAJE" => $row['ID_VIAJE'],
                    "ID_OFERTA" => $row['ID_OFERTA'],
                    "precio" => $row['precio'],
                    "aclaracion" => $row['aclaracion'],
                    "ID_CAMION" => $row['ID_CAMION'],
                    "capacidad" => $row['capacidad'],
                    "ruta" => $row['ruta'],
                    "patente" => $row['patente'],
                    "tipoDeCamion" => $row['tipoDeCamion'],
                    "ID_TRANSPORTISTA" => $row['ID_TRANSPORTISTA'],
                    "viajesRealizados" => $row['viajesRealizados'],
                );
            }
        }else{
                $json = array("error" => "Faltan Datos", "errno" => "404");
        }
            break;
        default:
            $json = array("error" => "Modo no valido", "errno" => "2");
        break;
    }
}else{
    $json = array("error" => "No se seleciono modo de publicaciones", "errno" => "1");
}
echo json_encode($json);
