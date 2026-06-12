<?php

include_once '../../Model/Model_Inicio.php';

session_start();
if(isset($_SESSION['usuario'])){

    $usuario=$_SESSION['usuario'];
    $_SESSION['idTrasportista']=$usuario->idTrasportista;


    // Menu
        // Boton Delogueo
        if (isset($_GET['btnLogout'])) {
            session_unset();
            session_destroy();
   
            header('Location:../login.php');
            }
    if (isset($_POST['btnAgregar'])) {
        header('Location:../registrarCamion.php');
    }
 
        // Boton Perfil
        if (isset($_GET['btnPerfil'])) {
            header('Location:perfil.php');
        }

    // Trae la vista

    // include_once '../../Vista/Camionero/Camiones.html';
    $tpl_landig = file_get_contents('../../Vista/Camionero/Camiones.html');
    $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
    echo $new_landig;








}
