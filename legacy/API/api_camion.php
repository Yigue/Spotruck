<?php
session_start();
header('Content-Type:application/json');

   
if(isset($_GET['modo'])){
  
   
    include_once '../Model/Model_Camiones.php';

    $test = new Camion();

    switch($_GET['modo']){
        case "test":

            $json=array(
            "idTrasportista" => $_SESSION['idTrasportista'],
            "tipoDeCamion" => $_POST['opTipoDeCamion'],
            "capacidad" => $_POST['capacidad'],
            "ruta" =>$_POST['ruta'],
            "patente" => $_POST['patente'],
            );
            
            $json = array("error" => "test", "errno" => "1000");
            break;
        case "cargarCamion":
            if(!empty($_POST['opTipoDeCamion']) and !empty($_POST['patente']) and !empty($_POST['ruta']) and !empty($_POST['capacidad']) and !empty($_SESSION['idTrasportista'])){
                $datos = new \stdClass();
                $datos->idTrasportista = $_SESSION['idTrasportista'];
                $datos->tipoCamion = $_POST['opTipoDeCamion'];
                $datos->capacidad = $_POST['capacidad'];
                $datos->ruta = $_POST['ruta'];
                $datos->patente = $_POST['patente'];
                $test->cargarCamion($datos);
                $json=$datos;
                $json = array("error" => "Se Cargo el camion", "errno" => "200");
            }else{
                $json = array("error" => "Complete Todos los Campos", "errno" => "204");
               
            }
            break;

        case "verMisCamiones":
            $response = $test->verMisCamiones($_SESSION['idTrasportista']);
            if($response->num_rows==0){
                $json = array("error" => "No tienes Camiones aun", "errno" => "404");
            }else{
                // $json = array("error" => "Ya tienes Camiones", "errno" => "200");
                while ($row = mysqli_fetch_array($response)) {
                    $json[] = array(
                        "idCamion" => $row['ID_CAMION'],
                        "idTrasportista" => $row['ID_TRASPORTISTA'],
                        "tipoCamion" => $row['tipoDeCamion'],
                        "capacidad" => $row['capacidad'],
                        "ruta" => $row['ruta'],
                        "patente" => $row['patente'],
                    );
                }
               
            }
        break;
        case "updateCamion":
            $datos = new \stdClass();
            $datos->idCamion = $_POST['idCamion'];
            $datos->tipoCamion = $_POST['opTipoDeCamion'];
            $datos->capacidad = $_POST['capacidad'];
            $datos->ruta = $_POST['ruta'];
            $datos->patente = $_POST['patente'];
            $test->modificarCamion($datos);
            $json = array("error" => "Se actualizo la Camion", "errno" => "200");
            break;
        case "deleteCamion":
            $test->borrarCamion($_GET['idCamion']);
            $json = array("error" => "Se Elimino la Camion", "errno" => "200");
            break;
        default:
            $json = array("error" => "Modo no valido", "errno" => "2");
        break;
    }
}else{
    $json = array("error" => "No se seleciono modo de publicaciones", "errno" => "1");
}
echo json_encode($json);
