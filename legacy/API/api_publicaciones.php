<?php

session_start();


header('Content-Type:application/json');

   
if(isset($_GET['modo'])){
   
    include_once '../Model/Model_Publicaciones.php';

    $test = new Publicaciones();

    switch($_GET['modo']){
        case "test":

            $json=array(
            "idEmpresa" => $_SESSION['idEmpresa'],
            "idTipoProducto" => $_POST['opTipoDeCarga'],
            "localidadOrigen" => $_POST['opLocalidadesOrigen'],
            "localidadDestino" =>$_POST['opLocalidadesDestino'],
            "fechaInicio" => $_POST['fechaInicio'],
            "fechaFin" => $_POST['fechaFin'],
            "detalle" => $_POST['detalles'],
            "peso" => $_POST['pesoCargamento'],
            "volumen" => $_POST['volumenCargamento'],
            );
            
            // $json = array("error" => "test", "errno" => "1000");
            break;
        case "hacerPublicaciones":
            if(!empty($_POST['opTipoDeCarga']) and !empty($_POST['opLocalidadesOrigen']) and !empty($_POST['opLocalidadesDestino']) and !empty($_POST['fechaInicio']) and !empty($_POST['fechaFin']) and !empty($_POST['detalles']) and !empty($_POST['volumenCargamento'])
            and !empty($_POST['pesoCargamento'])){ 
            $datos = new \stdClass();
            $datos->idEmpresa = $_SESSION['idEmpresa'];
            $datos->idTipoProducto =$_POST['opTipoDeCarga'];
            $datos->localidadOrigen =$_POST['opLocalidadesOrigen'];
            $datos->localidadDestino =$_POST['opLocalidadesDestino'] ;
            $datos->fechaInicio =$_POST['fechaInicio'] ;
            $datos->fechaFin =$_POST['fechaFin'] ;
            // $datos->ubicacion =$_POST[''];
            $datos->detalle =$_POST['detalles'];
            $datos->peso =$_POST['pesoCargamento'];
            $datos->volumen =$_POST['volumenCargamento'] ;
            $test->hacerPublicacion($datos);
            $json=array("error"=>"Se Realizo la publicacion","errno"=>"500");
            }else{
                $json = array("error" => "Complete Todos los Campos", "errno" => "505");
            
            }
            break;
        case "obtenerPublicaciones":
            $response=$test->obtenerPublicaciones();
            while ($row = mysqli_fetch_array($response)) {
                $json[]= array(
                    "ID_USUARIO" => $row['ID_USUARIO'],
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
                    "idSubasta" => $row['ID_SUBASTA'],
                    "estadoSubasta" => $row['estadoSubasta'],
                     
                );
            }
     
            break;
        case "obtenerMisPublicaciones":
            $response = $test->obtenerMisPublicaciones($_SESSION['idEmpresa']);
            if($response->num_rows==0){
                $json = array("error" => "No tienes Publicaciones aun", "errno" => "605");
            }else{
                // $json = array("error" => "Publicaciones Realizadas:", "errno" => "600");
                while ($row = mysqli_fetch_array($response)) {
                    $json[] = array(
                        "ID_USUARIO" => $row['ID_USUARIO'],
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
                    );
                }
               
            }
        break;
        case "obtenerData":
            $response = $test->obtenerDataPubli($_SESSION['idpubli']);
            if ($response->num_rows == 0){
                $json = array("error" => "No tienes Publicaciones aun", "errno" => "605");
            } else {
                // $json = array("error" => "Publicaciones Realizadas:", "errno" => "600");
                while ($row = mysqli_fetch_array($response)) {
                    $json[] = array(
                        "ID_USUARIO" => $row['ID_USUARIO'],
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
                    );
                }
            }
            break;
        case "updatePublicacion":
            // $datos = new \stdClass();
            // $datos->idUsuario = $_SESSION['idEmpresa']->idUsuario;
            // $datos->idEmpresa = $_SESSION['idEmpresa']->idEmpresa;
            // $datos->idtipoProducto = $_SESSION['idEmpresa']->idtipoProducto;
            // $datos->idlocalidad = $_SESSION['idEmpresa']->idlocalidad;
            // $datos->idestado = $_SESSION['idEmpresa']->idestado;
            // $datos->fechaInicio = $_SESSION['idEmpresa']->fechaInicio;
            // $datos->fechaFin = $_SESSION['idEmpresa']->fechaFin;
            // $datos->ubicacion = $_SESSION['idEmpresa']->ubicacion;
            // $datos->detalle = $_SESSION['idEmpresa']->detalle;
            // $datos->peso = $_SESSION['idEmpresa']->peso;
            // $datos->volumen = $_SESSION['idEmpresa']->volumen;
            // $test->updatePublicaciones($datos);
            // $json = array("error" => "Se actualizo la publiacion", "errno" => "200");
            break;
        case "deletePublicacion":
            $datos = new \stdClass();
            $idPublicacion = $_GET['idPublicacion'];
            $test->deletePublicaciones($idPublicacion);
            $json = array("error" => "Se Elimino la publiacion $idPublicacion", "errno" =>"200");
            break;
        default:
            $json = array("error" => "Modo no valido", "errno" => "2");
        break;
    }
}else{
    $json = array("error" => "No se seleciono modo de publicaciones", "errno" => "1");
}
echo json_encode($json);
?>