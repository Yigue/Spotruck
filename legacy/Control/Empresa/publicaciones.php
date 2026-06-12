<?php
include_once '../../Model/Model_Inicio.php';


session_start();




if (isset($_SESSION['usuario'])) {
    $msg = "";
    $usuario = $_SESSION['usuario'];
    
    // Boton Delogueo
    if (isset($_GET['btnLogout'])) {
        session_unset();
        session_destroy();
        header('Location:login.php');
    }
    // Boton Perfil
    

    $tpl_landig = file_get_contents('../../Vista/Empresa/publicaciones.html');
    $new_landig = str_replace("{{MENSAJE}}", $msg, $tpl_landig);
    $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
  
    echo $new_landig;
    // include_once '../../Vista/Empresa/publicaciones.html';
} else {
    // Sino existe las session
    header('Location:login.php');
}



?>

