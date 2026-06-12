<?php

include_once '../../Model/Model_Inicio.php';

session_start();
if(isset($_SESSION['usuario'])){

    $usuario = $_SESSION['usuario'];
    $_SESSION['idTrasportista'] = $usuario->idTrasportista;

    if(isset($_GET['idpubli'])){ 
        $_SESSION['idpublicacion'] = $_GET['idpubli'];
        header('Location:postularse.php');
    }


    // Menu
        // Boton Delogueo
        if (isset($_GET['btnLogout'])) {
            session_unset();
            session_destroy();
            header('Location:../login.php');
            }

        // Boton Perfil
        if (isset($_GET['btnPerfil'])) {
            header('Location:../perfil.php');
        }

    // Trae la vista

 
    $tpl_landig = file_get_contents('../../Vista/Camionero/paginaCamionero.html');
    $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
    echo $new_landig;





}
?>