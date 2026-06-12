<?php
session_start();
header('Content-Type:application/json');

if(isset($_GET['modo'])){
    include '../Model/Model_subastas.php';

    $datoSubasta = new \stdClass();
    $subasta = new subasta();

                    switch($_GET['modo']){
                        case "conseguirData":
                        $subasta->conseguirDataSubasta($_POST['idPubli']);
                        $json=array(
                            "error" => $subasta->error,
                            "errno" => $subasta->errno,
                            "ID_SUBASTA" => $subasta->ID_SUBASTA,
                            "ID_PUBLICACIONES" => $subasta->ID_PUBLICACIONES,
                            "estadoSubasta" => $subasta->estadoSubasta,
                            "fechaCreacion" => $subasta->fechaCreacion
                        );
                        break;
                        case "cerrarSubasta":
                            $subasta->cerrarSubasta($_POST['idPubli']);
                            $json = array(
                                "error" => $subasta->error,
                                "errno" => $subasta->errno,
                            );
                            break;
                        case "borrarSubasta":
                            $subasta->borrarSubasta($_POST['idPubli']);
                            $json = array(
                                "error" => $subasta->error,
                                "errno" => $subasta->errno,
                            );
                            break;
                        case "mostrarSubastas":
                            $response=$subasta->mostrarSubastas();
                            while ($row = mysqli_fetch_array($response)) {
                                $json[] = array(
                                    "ID_SUBASTA" => $row['ID_SUBASTA'],
                                    "ID_PUBLICACIONES" => $row['ID_PUBLICACIONES'],
                                    "estadoSubasta" => $row['estadoSubasta'],
                                    "fechaCreacion" => $row['fechaCreacion']
                                    ,);
                            }
                            break;
                        case "hacerOferta":
                            $datos = new \stdClass();
                            if(!empty($_POST['idCamion']) and !empty($_POST['aclaracion']) and !empty($_POST['precio']) and !empty($_SESSION['idSubasta'])){ 
                                    $datos->ID_SUBASTA = $_SESSION['idSubasta'];
                                    $datos->ID_CAMION = $_POST['idCamion'];
                                    $datos->precio = $_POST['precio'];
                                    $datos->aclaracion = $_POST['aclaracion'];
                                    $res=$subasta->hacerOferta($datos);

                                    if($res->errno==200){
                                            $json=array(
                                                    "error" => $res->error,
                                                    "errno" => $res->errno,
                                                    "idOferta" => $res->idOferta,
                                            );
                                    }else{
                                        $json=array(
                                            "error" => "Algo salio mal al realizar la oferta",
                                            "errno" => 404,
                                        );
                             
                                    }
                            } else {
                                    $json = array(
                                        "error" => "Complete Todos los datos",
                                        "errno" => 404,
                                    );
                             }  
                        break;
                        case "borrarOferta":
                            if(!empty($_POST['idOferta'])){
                                $res=$subasta->borrarOferta($_POST['idOferta']);
                                if($res->errno==200){
                                    $json = array(
                                        "error" => $res->error,
                                        "errno" => $res->errno,
                                    );
                                }else {
                                    $json = array(
                                        "error" => "Algo salio mal al borrar su oferta",
                                        "errno" => 404,
                                    );
                                        }
                            }else{
                                    $json = array(
                                        "error" => "Oferta",
                                        "errno" => 404,
                                    );
                            }
                            break;
                        case "modificarOferta":
                                if (!empty($_POST['idCamion']) and !empty($_POST['aclaracion']) and !empty($_POST['precio']) and !empty($_SESSION['idSubasta'])){
                                    $datos->ID_SUBASTA = $_SESSION['idSubasta'];
                                    $datos->ID_CAMION = $_POST['idCamion'];
                                    $datos->precio = $_POST['precio'];
                                    $datos->aclaracion = $_POST['aclaracion'];
      
                                    $res = $subasta->modificarOferta($datos);
       
                                    if ($res->errno == 200) {
                                        $json = array(
                                            "error" => $res->error,
                                            "errno" => $res->errno,
                                        );
                                    } else {
                                        $json = array(
                                            "error" => "Algo salio mal al Modificar la oferta",
                                            "errno" => 404,
                          
                                            
                                        );
                                    }
                                } else {
                                    $json = array(
                                        "error" => "Complete Todos los datos",
                                        "errno" => 404,
                                    );
                                }  
                            break;
                        case "verOfertas":
                            if(!empty($_SESSION['idpubli'])){ 
                                    $response=$subasta->mostrarOfertas($_SESSION['idpubli']);
                                    while ($row = mysqli_fetch_array($response)){
                                        if($row['estado']==0){
                                            $json[]=array(
                                                "idSubasta" => $row['ID_SUBASTA'],
                                                "fechaSubasta" => $row['fechaSubasta'],
                                                "estadoSubasta" => $row['estadoSubasta'],
                                                "idOferta" => $row['ID_OFERTA'],
                                                "estado" => $row['estado'],
                                                "precio" => $row['precio'],
                                                "aclaracion" => $row['aclaracion'],
                                                "fechaCreacion" => $row['fechaCreacion'],
                                                "idCamion" => $row['ID_CAMION'],
                                                "tipoDeCamion" => $row['tipoDeCamion'],
                                                "capacidad" => $row['capacidad'],
                                                "ruta" => $row['ruta'],
                                                "patente" => $row['patente'],
                                                "nombre" => $row['nombre'],
                                                "puntaje" => $row['puntaje'],
                                                "cuit" => $row['cuit'],
                                                "viajesRealizados" => $row['viajesRealizados'],
                                            );
                                        }
                                    }
                                }else{
                                        $json = array(
                                            "error" => "Algo a Salido Mal",
                                            "errno" => 404,
                                        );
                                }
                            break;
                            case "verMisPostulaciones":
                                $response = $subasta->verMisPostulaciones($_SESSION['idTrasportista']);
                                // var_dump(mysqli_fetch_array($response));
                                while ($row = mysqli_fetch_array($response)){
                                    $json[]=array(
                                        "idOferta" => $row['ID_OFERTA'],
                                        "idSubasta" => $row['ID_SUBASTA'],
                                        "estado" => $row['estado'],
                                        "precio" => $row["precio"],
                                        "aclaracion" => $row['aclaracion'],
                                        "fechaCreacion" => $row['fechaCreacionOferta'],
                                        "idPublicacion" => $row['ID_PUBLICACIONES'],
                                        "idCamion" => $row['ID_CAMION'],
                                        "capacidad" => $row['capacidad'],
                                        "patente" => $row['patente'],
                                        "ruta" => $row['ruta'],
                                        "TipoCamion" => $row['tipoDeCamion'],
                                    );
                                }
                                break;
                                case "rechazarOferta":
                                    if(!empty($_GET['ifOferta'])){ 
                                    $response = $subasta->bajarOferta($_GET['ifOferta']);
                                        $json = array(
                                            "error" => "Se Rechazo Oferta",
                                            "errno" => 200,
                                        );
                                    }else{
                                        $json = array(
                                            "error" => "falta id de Oferta",
                                            "errno" => 404,
                                        );
                                    }
                                break;
                                case "aceptarOferta":
                                        if (!empty($_GET['ifOferta']) and !empty($_GET['idSubasta']) and  !empty($_SESSION['idpubli']) ) {
                                            echo $_GET['idSubasta'];
                                            $response = $subasta->aceptarOferta($_GET['ifOferta'],$_GET['idSubasta'],$_SESSION['idpubli']);
                                            echo $response;
                                            $json = array(
                                                "error" => "Se cerro una Subasta",
                                                "errno" => 200,
                                            );
                                        }else{
                                            $json = array(
                                                "error" => "falta id de Oferta o de Publi",
                                                "errno" => 404,
                                            );
                                         }
                                break;                                                           
                        default:
                              $json = array("error" => "Modo no valido", "errno" => "2");
                        break;
                    }
}else{
    $json = array(
        "error" => "No se mando Modo",
        "errno" => "404",
    );
    }


echo json_encode($json);



?>